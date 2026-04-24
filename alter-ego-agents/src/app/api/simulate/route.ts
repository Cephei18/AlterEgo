import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "../../../lib/gemini";
import { getRedisClient } from "../../../lib/redis";
import { buildSimulationPrompt } from "../../../lib/agentPrompts";
import type { AgentPersonality, SimulationResult } from "../../../lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

function cleanModelText(rawText: string): string {
  return rawText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
}

function extractJsonBlock(rawText: string): string {
  const cleaned = cleanModelText(rawText);
  const jsonStart = cleaned.lastIndexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("No JSON found in simulation response");
  }

  return cleaned.slice(jsonStart, jsonEnd + 1);
}

function normalizeSimulationResult(
  parsed: any,
  agentA: AgentPersonality,
  agentB: AgentPersonality
): SimulationResult {
  return {
    fidA: agentA.fid,
    fidB: agentB.fid,
    compatibilityScore: Math.min(100, Math.max(0, Number(parsed.compatibilityScore) || 0)),
    compatibilityLabel: String(parsed.compatibilityLabel || "Unknown fit"),
    collaborationStyle: String(parsed.collaborationStyle || "No analysis returned"),
    talkingPoints: Array.isArray(parsed.talkingPoints)
      ? parsed.talkingPoints.slice(0, 3).map((item: unknown) => String(item)).concat([
          "Identify one concrete task to ship this week",
          "Define decision owner and communication cadence",
          "Align scope to a hackathon-sized deliverable"
        ]).slice(0, 3)
      : [
          "Identify one concrete task to ship this week",
          "Define decision owner and communication cadence",
          "Align scope to a hackathon-sized deliverable"
        ],
    riskFlag: String(parsed.riskFlag || "No risk flag returned"),
    simulationExcerpt: String(parsed.simulationExcerpt || ""),
    createdAt: Date.now()
  };
}

export async function POST(req: NextRequest) {
  const { agentA, agentB }: { agentA: AgentPersonality; agentB: AgentPersonality } =
    await req.json();

  if (!agentA || !agentB) {
    return NextResponse.json({ error: "Both agents required" }, { status: 400 });
  }

  const redis = getRedisClient();
  const cacheKey = `sim:${[agentA.fid, agentB.fid].sort().join(":")}`;
  const cached = await redis.get<SimulationResult>(cacheKey);

  if (cached) {
    return NextResponse.json({ result: cached, cached: true });
  }

  try {
    const prompt = buildSimulationPrompt(agentA, agentB);
    const rawText = await callLLM(prompt, 1500);

    const jsonStr = extractJsonBlock(rawText);
    const parsed = JSON.parse(jsonStr);
    const result = normalizeSimulationResult(parsed, agentA, agentB);

    await redis.set(cacheKey, result, { ex: 86400 });

    return NextResponse.json({ result, cached: false });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: error?.message || "Simulation failed" }, { status: 500 });
  }
}
