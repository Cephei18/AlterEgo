export function buildAgentExtractionPrompt(
	username: string,
	bio: string,
	casts: string[]
): string {
	return `You are an expert personality analyst. Analyze this Farcaster user's casts and extract a structured personality profile for use as an AI agent persona.

USER: @${username}
BIO: ${bio}

RECENT CASTS (last 40, most recent first):
${casts.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

Based ONLY on the evidence in these casts, extract a personality profile. Be specific and grounded - cite patterns you actually see, not generic descriptions.
Avoid vague claims like "passionate", "innovative", or "great communicator" unless directly evidenced.
If evidence is weak, say "insufficient evidence" for that field instead of inventing details.
Prefer concrete topical signals (tools, domains, repeated themes, posting behavior).

Return ONLY a valid JSON object with this exact structure:
{
	"communicationStyle": "string - how they write, tone, vocabulary level, use of jargon",
	"topInterests": ["array", "of", "3-5", "specific topics they post about most"],
	"workingStyle": "string - how they seem to approach work based on what they share",
	"collaborationStrengths": ["array", "of", "2-3", "genuine strengths for working with others"],
	"potentialWeaknesses": ["array", "of", "1-2", "honest friction points or blind spots"],
	"communicationTone": "string - casual/formal, warm/cold, direct/diplomatic",
	"decisionMaking": "string - how they seem to make decisions based on posts",
	"valueStatement": "string - what they seem to care about most professionally",
	"oneLiner": "string - a memorable 8-word description of this person's professional persona"
}

Return ONLY the JSON. No explanation, no markdown, no prefix.`;
}

export function buildJsonRepairPrompt(rawOutput: string): string {
	return `Convert the following model output into a valid JSON object ONLY.

Rules:
- Return ONLY valid JSON.
- Do not include markdown fences.
- Do not add extra keys.
- Preserve original meaning; only fix formatting/schema issues.

Expected keys:
communicationStyle, topInterests, workingStyle, collaborationStrengths, potentialWeaknesses, communicationTone, decisionMaking, valueStatement, oneLiner

Model output to repair:
${rawOutput}`;
}

export function buildSimulationPrompt(
	agentA: {
		username: string;
		oneLiner: string;
		communicationStyle: string;
		topInterests: string[];
		workingStyle: string;
		collaborationStrengths: string[];
		potentialWeaknesses: string[];
		decisionMaking: string;
		valueStatement: string;
	},
	agentB: {
		username: string;
		oneLiner: string;
		communicationStyle: string;
		topInterests: string[];
		workingStyle: string;
		collaborationStrengths: string[];
		potentialWeaknesses: string[];
		decisionMaking: string;
		valueStatement: string;
	}
): string {
	return `You are a collaboration dynamics simulator. You will simulate a short professional conversation between two people based on their personality profiles, then produce a structured analysis.

## AGENT A: @${agentA.username} - "${agentA.oneLiner}"
- Communication style: ${agentA.communicationStyle}
- Top interests: ${agentA.topInterests.join(", ")}
- Working style: ${agentA.workingStyle}
- Strengths: ${agentA.collaborationStrengths.join(", ")}
- Friction points: ${agentA.potentialWeaknesses.join(", ")}
- Decision making: ${agentA.decisionMaking}
- Core values: ${agentA.valueStatement}

## AGENT B: @${agentB.username} - "${agentB.oneLiner}"
- Communication style: ${agentB.communicationStyle}
- Top interests: ${agentB.topInterests.join(", ")}
- Working style: ${agentB.workingStyle}
- Strengths: ${agentB.collaborationStrengths.join(", ")}
- Friction points: ${agentB.potentialWeaknesses.join(", ")}
- Decision making: ${agentB.decisionMaking}
- Core values: ${agentB.valueStatement}

## YOUR TASK

Step 1: Simulate a 4-turn professional exchange between them. They've just been introduced at a hackathon and are exploring whether to collaborate. Each turn is 1-3 sentences. Keep each person consistent with their profile. Show natural chemistry OR friction where it exists - don't force positivity.

Format the simulation as:
A: [message]
B: [message]
A: [message]
B: [message]

Step 2: Based on what the simulation revealed, produce this exact JSON analysis:

{
  "simulationExcerpt": "the 4-turn dialogue you wrote above as a single string with \\n for newlines",
  "compatibilityScore": <integer 0-100>,
  "compatibilityLabel": "<5-8 word memorable label for this pairing>",
  "collaborationStyle": "<2-3 sentence analysis of how they would work together>",
  "talkingPoints": [
    "<specific shared interest or complementary skill>",
    "<second genuine connection point>",
    "<third concrete collaboration opportunity>"
  ],
  "riskFlag": "<one honest friction point or dynamic to watch>",
}

Return EXACTLY 3 items in talkingPoints.

## SCORING GUIDE
- 85-100: Rare natural fit. Deep overlap in values + complementary skills.
- 70-84: Strong pair. Clear synergy with minor friction.
- 55-69: Workable. Productive if they manage differences.
- 40-54: Challenging. Significant friction, limited overlap.
- 0-39: Poor fit. Fundamental misalignment.

Return the simulation first (A:/B: turns), then on a new line return ONLY the JSON block. No other text.`;
}
