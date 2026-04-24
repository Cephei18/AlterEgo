import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";
import type { SimulationResult } from "../../../../lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { result, usernameA, usernameB }: {
    result: SimulationResult;
    usernameA: string;
    usernameB: string;
  } = await req.json();

  const signerUuid = process.env.NEYNAR_SIGNER_UUID;
  if (!signerUuid) {
    return NextResponse.json({ error: "NEYNAR_SIGNER_UUID missing" }, { status: 400 });
  }

  const castText = `Alter Ego Agents report: @${usernameA} x @${usernameB}

Compatibility: ${result.compatibilityScore}/100 - ${result.compatibilityLabel}

${result.talkingPoints[0]}

Watch: ${result.riskFlag}

Built with @neynar + @gemini`;

  try {
    const client = getNeynarClient();
    await client.publishCast({
      postCastReqBody: {
        signerUuid,
        text: castText
      }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
