import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLatestGenerationJob } from "@/lib/generation-jobs";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ job: await getLatestGenerationJob(userId) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load generation status. Please try again." }, { status: 503 });
  }
}
