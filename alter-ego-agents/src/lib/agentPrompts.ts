export function buildAgentExtractionPrompt(
  username: string,
  bio: string,
  casts: string[]
): string {
  return `
You are an expert personality analyst.

Analyze this Farcaster user's posts and extract a structured professional personality profile.

USER: @${username}
BIO: ${bio}

RECENT CASTS:
${casts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

---

Return ONLY valid JSON. No explanation. No markdown. No extra text.

Schema:
{
  "communicationStyle": "string",
  "topInterests": ["exactly 3 to 5 items"],
  "workingStyle": "string",
  "collaborationStrengths": ["2 to 3 items"],
  "potentialWeaknesses": ["1 to 2 items"],
  "communicationTone": "string",
  "decisionMaking": "string",
  "valueStatement": "string",
  "oneLiner": "short sentence"
}

---

STRICT RULES:

- Output MUST be valid JSON
- Do NOT include markdown (no \`\`\`)
- Do NOT include trailing commas
- Do NOT include line breaks inside strings
- Do NOT use quotes inside values
- Keep sentences short and clean
- Avoid vague words like "passionate" or "innovative"

FIELD RULES:

- topInterests MUST have 3 to 5 items
- collaborationStrengths MUST have 2 to 3 items
- potentialWeaknesses MUST have 1 to 2 items

If unsure, infer based on available data.

Return ONLY the JSON object.
`;
}

export function buildJsonRepairPrompt(rawOutput: string): string {
  return `
Fix the following into valid JSON.

Rules:
- Return ONLY valid JSON
- No markdown
- No explanations
- Fix broken quotes, commas, or structure
- Ensure all arrays follow required lengths

Required fields:
communicationStyle, topInterests, workingStyle, collaborationStrengths, potentialWeaknesses, communicationTone, decisionMaking, valueStatement, oneLiner

Constraints:
- topInterests: 3 to 5 items
- collaborationStrengths: 2 to 3 items
- potentialWeaknesses: 1 to 2 items

Input:
${rawOutput}
`;
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
  return `
You are simulating collaboration between two people.

AGENT A (@${agentA.username}):
- ${agentA.oneLiner}
- Style: ${agentA.communicationStyle}
- Interests: ${agentA.topInterests.join(", ")}

AGENT B (@${agentB.username}):
- ${agentB.oneLiner}
- Style: ${agentB.communicationStyle}
- Interests: ${agentB.topInterests.join(", ")}

---

Step 1: Simulate a 4-turn realistic conversation.

Format:
A: ...
B: ...
A: ...
B: ...

---

Step 2: Return ONLY this JSON:

{
  "simulationExcerpt": "string",
  "compatibilityScore": number,
  "compatibilityLabel": "short label",
  "collaborationStyle": "2-3 sentences",
  "talkingPoints": ["item1", "item2", "item3"],
  "riskFlag": "string"
}

---

Rules:
- talkingPoints MUST be exactly 3 items
- No markdown
- No extra text
`;
}