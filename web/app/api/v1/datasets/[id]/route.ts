import { NextResponse } from "next/server";

import { getAllRecordIds, getRecord } from "@/lib/data";
import { fitVerdicts, slimVerdict } from "@/lib/fit";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllRecordIds().map((id) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = getRecord(id);
  if (!record) {
    return NextResponse.json(
      { error: "not found", id, hint: "See /api/v1/search for valid identifiers." },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
  // The record as the pipeline wrote it, plus the six analysis verdicts the site derives
  // from it. Evidence arrays are dropped from the verdicts here because each one is a
  // copy of evidence already present on the record.
  return NextResponse.json(
    {
      ...record,
      analysis_fit: fitVerdicts(record).map(slimVerdict),
    },
    {
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  );
}
