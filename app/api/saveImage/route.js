import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARILY DISABLED
 * This stub exists ONLY to unblock Next.js build.
 * We will re-enable saving AFTER deploy is green.
 */
export async function POST() {
  return NextResponse.json(
    { error: "saveImage temporarily disabled" },
    { status: 503 }
  );
}
