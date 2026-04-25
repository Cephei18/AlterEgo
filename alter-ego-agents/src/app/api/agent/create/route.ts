import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "../../../../lib/neynar";
import { callLLM } from "../../../../lib/gemini";
import { getRedisClient } from "../../../../lib/redis";
import { buildAgentExtractionPrompt, buildJsonRepairPrompt } from "../../../../lib/agentPrompts";
import type { AgentPersonality } from "@/lib/types";


export const maxDuration = 30;
export const dynamic = "force-dynamic";

// REPLACE with this explicit type:
type PersonalityCore = {
  communicationStyle: string;
  topInterests: string[];
  workingStyle: string;
  collaborationStrengths: string[];
  potentialWeaknesses: string[];
  communicationTone: string;
  decisionMaking: string;
  valueStatement: string;
  oneLiner: string;
};

function normalizeCastText(text: string | null | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function isStringArray(value: unknown, min: number, max: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= min &&
    value.length <= max &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isNonEmptyString(value: unknown, minLength = 4): value is string {
  return typeof value === "string" && value.trim().length >= minLength;
}

function validatePersonalityShape(value: unknown): asserts value is PersonalityCore {  if (!value || typeof value !== "object") {
    throw new Error("Invalid personality JSON: expected object");
  }
  const data = value as Record<string, unknown>;
  if (!isNonEmptyString(data.communicationStyle, 8))
    throw new Error("Invalid personality JSON: communicationStyle too weak");
  if (!isStringArray(data.topInterests, 3, 5))
    throw new Error("Invalid personality JSON: topInterests must be 3-5 items");
  if (!isNonEmptyString(data.workingStyle, 8))
    throw new Error("Invalid personality JSON: workingStyle too weak");
  if (!isStringArray(data.collaborationStrengths, 2, 3))
    throw new Error("Invalid personality JSON: collaborationStrengths must be 2-3 items");
  if (!isStringArray(data.potentialWeaknesses, 1, 2))
    throw new Error("Invalid personality JSON: potentialWeaknesses must be 1-2 items");
  if (!isNonEmptyString(data.communicationTone, 6))
    throw new Error("Invalid personality JSON: communicationTone too weak");
  if (!isNonEmptyString(data.decisionMaking, 6))
    throw new Error("Invalid personality JSON: decisionMaking too weak");
  if (!isNonEmptyString(data.valueStatement, 6))
    throw new Error("Invalid personality JSON: valueStatement too weak");
  if (!isNonEmptyString(data.oneLiner, 8))
    throw new Error("Invalid personality JSON: oneLiner too weak");
}
async function parsePersonalityWithRepair(rawText: string): Promise<PersonalityCore> {
  try {
    const parsed = JSON.parse(extractJsonCandidate(rawText));
    validatePersonalityShape(parsed);
    return parsed;
  } catch {
    const repaired = await callLLM(buildJsonRepairPrompt(rawText), 1024);
    const parsed = JSON.parse(extractJsonCandidate(repaired));
    validatePersonalityShape(parsed);
    return parsed;
  }
}

// ─── Neynar helpers (all using current SDK conventions) ───────────────────────

async function fetchUserProfileByFid(fid: number) {
  const client = getNeynarClient();
  // fids must be a comma-separated STRING, not an array
  const response = await client.fetchBulkUsers({ fids: String(fid) });
  const user = response.users?.[0];
  if (!user) throw new Error(`No user found for fid ${fid}`);
  return user;
}

async function fetchUserByUsername(username: string) {
  const client = getNeynarClient();
  const response = await client.lookupUserByUsername({ username });
  const user = response.user;
  if (!user) throw new Error(`No user found for username ${username}`);
  return user;
}

async function fetchCastsForFid(fid: number): Promise<string[]> {
  const client = getNeynarClient();
  const response = await client.fetchCastsForUser({ fid, limit: 50 });
  return (response.casts ?? [])
    .map((cast: { text?: string | null }) => normalizeCastText(cast.text))
    .filter((text) => text.length > 10 && /[a-zA-Z0-9]/.test(text))
    .slice(0, 40);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const fid = typeof payload.fid === "number" ? payload.fid : Number(payload.fid);
  const username = typeof payload.username === "string" ? payload.username.trim() : "";

  const hasFid = Number.isFinite(fid) && fid > 0;
  const hasUsername = username.length > 0;

  if (!hasFid && !hasUsername) {
    return NextResponse.json({ error: "FID or username required" }, { status: 400 });
  }

  const redis = getRedisClient();
  const cacheKey = hasFid ? `agent:${fid}` : `agent:username:${username}`;

  const cached = await redis.get<AgentPersonality>(cacheKey);
  if (cached) {
    return NextResponse.json({ agent: cached, cached: true });
  }

  try {
    let user: any;
    let casts: string[];

    if (hasFid) {
      [user, casts] = await Promise.all([
        fetchUserProfileByFid(fid),
        fetchCastsForFid(fid),
      ]);
    } else {
      user = await fetchUserByUsername(username);
      casts = await fetchCastsForFid(user.fid);
    }

    if (casts.length < 5) {
      return NextResponse.json(
        { error: "Not enough cast history to create an agent (need at least 5 casts)" },
        { status: 422 }
      );
    }

    const bio =
      user.profile?.bio?.text ??
      user.bio ??
      "";

    const prompt = buildAgentExtractionPrompt(user.username, bio, casts);
    const rawText = await callLLM(prompt, 1024);
    const personality = await parsePersonalityWithRepair(rawText);

    const agent: AgentPersonality = {
      fid: user.fid,
      username: user.username,
      // SDK v2 uses camelCase; keep fallbacks for safety
      displayName: user.displayName ?? user.display_name ?? "",
      pfpUrl: user.pfpUrl ?? user.pfp_url ?? "",
      ...personality,
      createdAt: Date.now(),
    };

    await redis.set(cacheKey, agent, { ex: 3600 });

    return NextResponse.json({ agent, cached: false });
  } catch (error: any) {
    console.error("Agent creation error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Agent creation failed" },
      { status: 500 }
    );
  }
}