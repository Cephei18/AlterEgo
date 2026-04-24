export function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-green-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getScoreRing(score: number): string {
  if (score >= 85) return "stroke-emerald-400";
  if (score >= 70) return "stroke-green-400";
  if (score >= 55) return "stroke-yellow-400";
  if (score >= 40) return "stroke-orange-400";
  return "stroke-red-400";
}

export function getScoreVerb(score: number): string {
  if (score >= 85) return "Rare natural fit";
  if (score >= 70) return "Strong pairing";
  if (score >= 55) return "Workable match";
  if (score >= 40) return "Challenging pair";
  return "Poor fit";
}

export interface SimulationOutput {
  result: {
    compatibilityScore: number;
    compatibilityLabel: string;
    collaborationStyle: string;
    talkingPoints: [string, string, string];
    riskFlag: string;
    simulationExcerpt: string;
  };
  cached: boolean;
}
