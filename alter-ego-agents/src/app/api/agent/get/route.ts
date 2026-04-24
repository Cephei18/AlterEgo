import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "../../../../lib/redis";

export async function GET(req: NextRequest) {
  try {
    const fid = req.nextUrl.searchParams.get("fid");
    if (!fid) {
      return NextResponse.json({ error: "FID required" }, { status: 400 });
    }

    const redis = getRedisClient();
    const agent = await redis.get(`agent:${fid}`);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load agent" }, { status: 500 });
  }
}
