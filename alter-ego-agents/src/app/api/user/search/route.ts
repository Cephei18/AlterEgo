import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";

export async function GET(req: NextRequest) {
  const usernameRaw = req.nextUrl.searchParams.get("username");
  const username = (usernameRaw || "").replace(/^@+/, "").trim();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const client = getNeynarClient();
    const res = await client.lookupUserByUsername({ username });
    return NextResponse.json({ user: res.user });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}