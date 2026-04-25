import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";
import type { SimulationResult } from "../../../../lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { result, usernameA, usernameB, signerUuid }: {
    result: SimulationResult;
    usernameA: string;
    usernameB: string;
    signerUuid: string;        // ← comes from the logged-in user's session
  } = await req.json();

  if (!signerUuid) {
    return NextResponse.json({ error: "signerUuid missing — user not signed in" }, { status: 400 });
  }

  const castText =
    `Alter Ego Agents: @${usernameA} × @${usernameB}\n\n` +
    `Compatibility: ${result.compatibilityScore}/100 — ${result.compatibilityLabel}\n\n` +
    `${result.talkingPoints[0]}\n\n` +
    `⚠️ ${result.riskFlag}`;

  try {
    const client = getNeynarClient();
    await client.publishCast({
      signerUuid,              // ← user's own signer, not env var
      text: castText,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cast share error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}