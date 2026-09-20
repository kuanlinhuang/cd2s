"""Cached, polite HTTP layer.

Every fetch is cached on disk keyed by a hash of (method, url, body) so a full rebuild
is reproducible offline and we never hammer a public API twice for the same thing.
Each response records `retrieved_at`, which flows into Evidence.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from cds.paths import CACHE_DIR

USER_AGENT = (
    "CancerDataShowcase/0.1 (NCI ODS Impact Prize Track 1; "
    "https://github.com/kuanlinhuang/cd2s; contact via repository issues)"
)

# Politeness: minimum seconds between live requests to the same host.
HOST_DELAYS: dict[str, float] = {
    "eutils.ncbi.nlm.nih.gov": 0.4,  # NCBI: <=3 req/s without a key
    "api.reporter.nih.gov": 1.0,
    "www.ebi.ac.uk": 0.25,
    "api.gdc.cancer.gov": 0.25,
    "proteomic.datacommons.cancer.gov": 0.5,
    "api.openalex.org": 0.15,
    "api.datacite.org": 0.3,
    "www.cbioportal.org": 0.25,
}
DEFAULT_DELAY = 0.3
_last_hit: dict[str, float] = {}

# Hosts that serve the same API under more than one name. A cached build keys on the
# canonical URL, so the fallback never changes the cache or the evidence we would have
# recorded from the canonical host - it only keeps a rebuild working on a network where
# one of the names does not resolve. PDC publishes its GraphQL endpoint at both of
# these; the second is the portal's own domain.
EQUIVALENT_HOSTS: dict[str, tuple[str, ...]] = {
    "proteomic.datacommons.cancer.gov": ("pdc.cancer.gov",),
    "pdc.cancer.gov": ("proteomic.datacommons.cancer.gov",),
}


def _is_name_resolution_error(exc: Exception) -> bool:
    """A DNS failure, as opposed to a refused connection or a timeout."""
    text = str(exc).lower()
    return any(
        marker in text
        for marker in (
            "nodename nor servname",
            "name or service not known",
            "temporary failure in name resolution",
            "getaddrinfo failed",
            "no address associated with hostname",
        )
    )


class FetchError(RuntimeError):
    pass


@dataclass
class Response:
    url: str
    status: int
    text: str
    retrieved_at: datetime
    from_cache: bool
    headers: dict[str, str] = field(default_factory=dict)

    def json(self) -> Any:
        return json.loads(self.text)

    @property
    def ok(self) -> bool:
        return 200 <= self.status < 300


def _key(method: str, url: str, body: str | None, extra: str = "") -> str:
    h = hashlib.sha256()
    h.update(method.upper().encode())
    h.update(b"\x00")
    h.update(url.encode())
    h.update(b"\x00")
    h.update((body or "").encode())
    h.update(b"\x00")
    h.update(extra.encode())
    return h.hexdigest()[:40]


def _cache_path(namespace: str, key: str) -> Path:
    return CACHE_DIR / namespace / key[:2] / f"{key}.json"


def _throttle(url: str) -> None:
    host = httpx.URL(url).host or ""
    delay = HOST_DELAYS.get(host, DEFAULT_DELAY)
    prev = _last_hit.get(host)
    now = time.monotonic()
    if prev is not None:
        wait = delay - (now - prev)
        if wait > 0:
            time.sleep(wait)
    _last_hit[host] = time.monotonic()


class Client:
    """Synchronous fetcher with disk cache. `namespace` segments the cache per source."""

    def __init__(
        self,
        namespace: str,
        *,
        timeout: float = 90.0,
        max_age_days: float | None = None,
        offline: bool = False,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.namespace = namespace
        self.max_age_days = max_age_days
        self.offline = offline or os.environ.get("CDS_OFFLINE") == "1"
        self._client = httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT, **(headers or {})},
            http2=False,
        )
        self.n_live = 0
        self.n_cached = 0

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> Client:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # -- cache ------------------------------------------------------------------
    def _read_cache(self, key: str) -> Response | None:
        p = _cache_path(self.namespace, key)
        if not p.exists():
            return None
        try:
            raw = json.loads(p.read_text())
        except Exception:
            return None
        ts = datetime.fromisoformat(raw["retrieved_at"])
        if self.max_age_days is not None:
            age_days = (datetime.now(UTC) - ts).total_seconds() / 86400
            if age_days > self.max_age_days:
                return None
        return Response(
            url=raw["url"],
            status=raw["status"],
            text=raw["text"],
            retrieved_at=ts,
            from_cache=True,
            headers=raw.get("headers", {}),
        )

    def _write_cache(self, key: str, resp: Response) -> None:
        p = _cache_path(self.namespace, key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(
            json.dumps(
                {
                    "url": resp.url,
                    "status": resp.status,
                    "text": resp.text,
                    "retrieved_at": resp.retrieved_at.isoformat(),
                    "headers": resp.headers,
                },
                ensure_ascii=False,
            )
        )

    # -- fetch ------------------------------------------------------------------
    def _request(
        self, method: str, url: str, *, body: Any = None, params: Any = None
    ) -> httpx.Response:
        _throttle(url)
        if method.upper() == "GET":
            return self._client.get(url, params=params)
        if isinstance(body, (dict, list)):
            return self._client.post(url, json=body, params=params)
        return self._client.post(url, content=body, params=params)

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential_jitter(initial=2, max=45),
        retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
        reraise=True,
    )
    def _live(self, method: str, url: str, *, body: Any = None, params: Any = None) -> Response:
        try:
            r = self._request(method, url, body=body, params=params)
        except httpx.ConnectError as exc:
            if not _is_name_resolution_error(exc):
                raise
            r = None
            host = httpx.URL(url).host or ""
            for alt in EQUIVALENT_HOSTS.get(host, ()):
                try:
                    r = self._request(
                        method, str(httpx.URL(url).copy_with(host=alt)), body=body, params=params
                    )
                    break
                except httpx.ConnectError:
                    continue
            if r is None:
                raise
        # Retry on transient server-side and rate-limit codes only.
        if r.status_code in (429, 500, 502, 503, 504):
            raise httpx.HTTPStatusError(
                f"{r.status_code} from {url}", request=r.request, response=r
            )
        self.n_live += 1
        return Response(
            url=str(r.url),
            status=r.status_code,
            text=r.text,
            retrieved_at=datetime.now(UTC),
            from_cache=False,
            headers={k.lower(): v for k, v in r.headers.items()},
        )

    def get(
        self, url: str, *, params: Any = None, cache: bool = True, cache_extra: str = ""
    ) -> Response:
        full = str(httpx.URL(url).copy_merge_params(params or {}))
        key = _key("GET", full, None, cache_extra)
        if cache:
            hit = self._read_cache(key)
            if hit is not None:
                self.n_cached += 1
                return hit
        if self.offline:
            raise FetchError(f"offline and not cached: {full}")
        resp = self._live("GET", url, params=params)
        if cache and resp.ok:
            self._write_cache(key, resp)
        return resp

    def post(
        self,
        url: str,
        *,
        body: Any = None,
        params: Any = None,
        cache: bool = True,
        cache_extra: str = "",
    ) -> Response:
        body_s = (
            json.dumps(body, sort_keys=True) if isinstance(body, (dict, list)) else (body or "")
        )
        key = _key("POST", url, body_s, cache_extra)
        if cache:
            hit = self._read_cache(key)
            if hit is not None:
                self.n_cached += 1
                return hit
        if self.offline:
            raise FetchError(f"offline and not cached: {url} {body_s[:120]}")
        resp = self._live("POST", url, body=body, params=params)
        if cache and resp.ok:
            self._write_cache(key, resp)
        return resp

    def graphql(
        self, url: str, query: str, variables: dict[str, Any] | None = None, *, cache: bool = True
    ) -> Any:
        payload: dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables
        r = self.post(url, body=payload, cache=cache)
        if not r.ok:
            raise FetchError(f"GraphQL HTTP {r.status} from {url}: {r.text[:300]}")
        data = r.json()
        if data.get("errors"):
            msgs = "; ".join(str(e.get("message"))[:200] for e in data["errors"][:3])
            if data.get("data") is None:
                raise FetchError(f"GraphQL errors from {url}: {msgs}")
        return data.get("data"), r.retrieved_at

    def head_ok(self, url: str, *, timeout: float = 25.0) -> tuple[int | None, str | None]:
        """Link checking. Falls back to a ranged GET for servers that reject HEAD."""
        try:
            _throttle(url)
            r = self._client.head(url, timeout=timeout)
            if r.status_code in (403, 405, 501):
                _throttle(url)
                r = self._client.get(url, timeout=timeout, headers={"Range": "bytes=0-2048"})
            return r.status_code, str(r.url) if str(r.url) != url else None
        except Exception as exc:  # noqa: BLE001 - link checks must never abort a build
            return None, f"{type(exc).__name__}: {exc}"
