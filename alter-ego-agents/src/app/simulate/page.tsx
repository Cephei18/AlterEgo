
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SimulationResult } from "../../lib/types";
import { getScoreColor, getScoreVerb } from "../../lib/scoreHelpers";
const [shareError, setShareError] = useState("");

export default function SimulatePage() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [agents, setAgents] = useState<any>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const r = sessionStorage.getItem("sim_result");
    const a = sessionStorage.getItem("sim_agents");
    if (r) setResult(JSON.parse(r) as SimulationResult);
    if (a) setAgents(JSON.parse(a));
  }, []);

  const shareToFarcaster = async () => {
  if (!result || !agents) return;
  setSharing(true);
  setShareError("");

  try {
    // Get the user's signer_uuid from sessionStorage
    const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");
    const signerUuid = fcUser.signerUuid;

    if (!signerUuid) throw new Error("Not signed in. Go back to home and reconnect.");

    const res = await fetch("/api/cast/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result,
        usernameA: agents.agentA.username,
        usernameB: agents.agentB.username,
        signerUuid,            // ← pass it here
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Share failed");
    setShared(true);
  } catch (e: any) {
    setShareError(e.message);
  } finally {
    setSharing(false);
  }
};

  
  if (!result) return <div className="text-white p-8">Loading...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className={`text-8xl font-black mb-2 ${getScoreColor(result.compatibilityScore)}`}>
          {result.compatibilityScore}
        </div>
        <div className="text-gray-400 text-sm uppercase tracking-widest mb-1">
          {getScoreVerb(result.compatibilityScore)}
        </div>
        <div className="text-white text-2xl font-semibold">{result.compatibilityLabel}</div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <div className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-2">
          How you'd work together
        </div>
        <p className="text-gray-200 text-sm leading-relaxed">{result.collaborationStyle}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <div className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-3">
          3 things to talk about
        </div>
        <div className="space-y-3">
          {result.talkingPoints.map((pt, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-green-400 font-bold">{i + 1}.</span>
              <span className="text-gray-200">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-orange-900/50 rounded-xl p-6 mb-4">
        <div className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-2">
          Watch out for
        </div>
        <p className="text-gray-200 text-sm">{result.riskFlag}</p>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
          Agent simulation excerpt
        </div>
        <div className="space-y-2 font-mono text-xs">
          {result.simulationExcerpt
            .split("\n")
            .filter(Boolean)
            .map((line, i) => (
              <div key={i} className={line.startsWith("A:") ? "text-purple-300" : "text-teal-300"}>
                {line}
              </div>
            ))}
        </div>
      </div>

      <button
        onClick={shareToFarcaster}
        disabled={sharing || shared}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-all"
      >
        {shared
          ? "✓ Shared to Farcaster"
          : sharing
            ? "Sharing..."
            : `Share this brief on Farcaster ${"->"}`}
      </button>
    </main>
  );
}
