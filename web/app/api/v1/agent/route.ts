import { NextResponse } from "next/server";

import { answer } from "@/lib/agent";

export const dynamic = "force-dynamic";

/**
 * The function's own budget, in seconds.
 *
 * It has to be stated. The model call is given `AGENT_MODEL_TIMEOUT_MS` and the route
 * then falls back to the deterministic rules, but a platform default shorter than that
 * kills the function first: the visitor gets a 504 and the fallback that exists for
 * exactly this case never runs. 60 is the ceiling on every Vercel plan, and the model
 * timeout is set well inside it so the rules answer always has room to be written.
 */
export const maxDuration = 60;

/**
 * The dataset agent as an endpoint: describe an analysis, get a ranked shortlist with
 * reasons and blockers. GET with ?q= or POST {"q": "..."}. Same response either way.
 */
async function handle(q: string | null) {
  const query = (q ?? "").trim();
  if (query.length < 3) {
    return NextResponse.json({ error: "Describe the analysis you want to run in a few words." }, { status: 400 });
  }
  const result = await answer(query);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return handle(searchParams.get("q"));
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const q = body && typeof body === "object" && "q" in body ? String((body as { q: unknown }).q ?? "") : null;
  return handle(q);
}
