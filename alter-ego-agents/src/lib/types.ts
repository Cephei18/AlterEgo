export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
}

export interface AgentPersonality {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  communicationStyle: string;
  topInterests: string[];
  workingStyle: string;
  collaborationStrengths: string[];
  potentialWeaknesses: string[];
  communicationTone: string;
  decisionMaking: string;
  valueStatement: string;
  oneLiner: string;
  createdAt: number;
}

export interface SimulationResult {
  fidA: number;
  fidB: number;
  compatibilityScore: number;
  compatibilityLabel: string;
  collaborationStyle: string;
  talkingPoints: string[];
  riskFlag: string;
  simulationExcerpt: string;
  createdAt: number;
}
