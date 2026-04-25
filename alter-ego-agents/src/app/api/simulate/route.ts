import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "../../../lib/gemini";
import { getRedisClient } from "../../../lib/redis";
import { buildSimulationPrompt } from "../../../lib/agentPrompts";
import type { AgentPersonality, SimulationResult } from "../../../lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/* ------------------ HELPERS ------------------ */

function cleanModelText(rawText: string): string {
  return rawText
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
}

function extractJsonBlock(rawText: string): string {
  const cleaned = cleanModelText(rawText);
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("No JSON found in simulation response");
  }

  return match[0];
}

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeSimulationResult(
  parsed: any,
  agentA: AgentPersonality,
  agentB: AgentPersonality
): SimulationResult {
  return {
    fidA: agentA.fid,
    fidB: agentB.fid,

    compatibilityScore: Math.min(
      100,
      Math.max(0, Number(parsed.compatibilityScore) || 60)
    ),

    compatibilityLabel: String(
      parsed.compatibilityLabel || "Potential collaboration"
    ),

    collaborationStyle: String(
      parsed.collaborationStyle ||
        "They can collaborate effectively with aligned expectations."
    ),

    talkingPoints: Array.isArray(parsed.talkingPoints)
      ? parsed.talkingPoints
          .slice(0, 3)
          .map((item: unknown) => String(item))
      : [
          "Define clear roles early",
          "Align on project scope",
          "Set communication expectations",
        ],

    riskFlag: String(
      parsed.riskFlag || "Differences in working style may cause friction"
    ),

    simulationExcerpt: String(parsed.simulationExcerpt || ""),

    createdAt: Date.now(),
  };
}

/* ------------------ ROUTE ------------------ */

export async function POST(req: NextRequest) {
  try {
    const {
      agentA,
      agentB,
    }: { agentA: AgentPersonality; agentB: AgentPersonality } =
      await req.json();

    if (!agentA || !agentB) {
      return NextResponse.json(
        { error: "Both agents required" },
        { status: 400 }
      );
    }

    const redis = getRedisClient();
    const cacheKey = `sim:${[agentA.fid, agentB.fid].sort().join(":")}`;

    const cached = await redis.get<SimulationResult>(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, cached: true });
    }

    /* ---------- LLM CALL ---------- */

    const prompt = buildSimulationPrompt(agentA, agentB);
    const rawText = await callLLM(prompt, 1500);

    let parsed = null;

    try {
      const jsonStr = extractJsonBlock(rawText);
      parsed = safeParseJSON(jsonStr);
    } catch {
      parsed = null;
    }

    /* ---------- FALLBACK ---------- */

    if (!parsed) {
      console.warn("⚠️ Using fallback simulation");

      parsed = {
        compatibilityScore: 65,
        compatibilityLabel: "Potential but needs alignment",
        collaborationStyle:
          "They can collaborate effectively if expectations are aligned early.",
        talkingPoints: [
          "Define project scope clearly",
          "Align on working speed",
          "Assign clear responsibilities",
        ],
        riskFlag: "Different working styles may cause friction",
        simulationExcerpt: rawText.slice(0, 500),
      };
    }

    /* ---------- NORMALIZE ---------- */

    const result = normalizeSimulationResult(parsed, agentA, agentB);

    await redis.set(cacheKey, result, { ex: 86400 });

    return NextResponse.json({ result, cached: false });

  } catch (error: any) {
    console.error("Simulation error:", error);

    return NextResponse.json(
      { error: error?.message || "Simulation failed" },
      { status: 500 }
    );
  }
}