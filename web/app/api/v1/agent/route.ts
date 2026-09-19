import { NextResponse } from "next/server";

import { answer } from "@/lib/agent";

export const dynamic = "force-dynamic";

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
