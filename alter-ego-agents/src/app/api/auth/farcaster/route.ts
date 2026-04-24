import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const tokenRes = await fetch("https://api.neynar.com/v2/farcaster/login/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.NEYNAR_API_KEY!
      },
      body: JSON.stringify({ code })
    });

    const tokenData = await tokenRes.json();
    const fid = tokenData?.result?.user?.fid ?? tokenData?.fid;

    if (!fid) {
      throw new Error("Could not get FID from token");
    }

    const client = getNeynarClient();
    const userRes = await client.fetchBulkUsers({ fids: [fid] });
    const user = userRes.users[0];

    if (!user) {
      throw new Error("Could not load user profile from FID");
    }

    const safe = (value: unknown) =>
      String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");

    const html = `
      <script>
        window.opener.postMessage({
          type: "neynar_auth_success",
          fid: ${Number(user.fid)},
          username: "${safe(user.username)}",
          displayName: "${safe(user.display_name ?? "")}",
          pfpUrl: "${safe(user.pfp_url ?? "")}",
          bio: "${safe(user.profile?.bio?.text ?? "")}"
        }, "*");
        window.close();
      </script>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
