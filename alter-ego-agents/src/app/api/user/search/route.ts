import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";

export async function GET(req: NextRequest) {
  const usernameRaw = req.nextUrl.searchParams.get("username");

  const username = (usernameRaw || "")
    .replace(/^@+/, "")
    .trim();

  if (!username) {
    return NextResponse.json(
      { error: "Username required" },
      { status: 400 }
    );
  }

  try {
    const client = getNeynarClient();

    // ✅ FIXED: correct argument shape
    const res = await client.lookupUserByUsername({
      username: username,
    });

     const user = res?.user;
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (err) {
    console.error("User search error:", err);

    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }
}