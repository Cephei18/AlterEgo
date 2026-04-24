"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentPersonality } from "../../lib/types";

export default function AgentPage() {
  const [agent, setAgent] = useState<AgentPersonality | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = sessionStorage.getItem("fc_user");
    if (!userStr) {
      router.push("/");
      return;
    }

    const user = JSON.parse(userStr) as { fid: number };
    fetch(`/api/agent/get?fid=${user.fid}`)
      .then((r) => r.json())
      .then((d) => {
        setAgent((d?.agent || null) as AgentPersonality | null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) return <LoadingScreen text="Reading your casts..." />;
  if (!agent) return <div className="min-h-screen bg-black text-white p-8">Error loading agent</div>;

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={agent.pfpUrl} alt={agent.displayName} className="w-16 h-16 rounded-full" />
        <div>
          <div className="font-bold text-xl">{agent.displayName}</div>
          <div className="text-purple-400">@{agent.username}</div>
          <div className="text-gray-400 text-sm italic mt-1">"{agent.oneLiner}"</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <AgentTrait label="Communication" value={agent.communicationStyle} />
        <AgentTrait label="Working style" value={agent.workingStyle} />
        <AgentTrait label="Interests" value={agent.topInterests.join(" · ")} />
        <AgentTrait label="Strengths" value={agent.collaborationStrengths.join(" · ")} />
        <AgentTrait
          label="Watch out for"
          value={agent.potentialWeaknesses.join(" · ")}
          accent="orange"
        />
      </div>

      <button
        onClick={() => router.push("/search")}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-4 rounded-xl text-lg transition-all"
      >
        {`Find someone to collaborate with ${"->"}`}
      </button>
    </main>
  );
}

function AgentTrait({
  label,
  value,
  accent = "purple"
}: {
  label: string;
  value: string;
  accent?: "purple" | "orange";
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div
        className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
          accent === "orange" ? "text-orange-400" : "text-purple-400"
        }`}
      >
        {label}
      </div>
      <div className="text-gray-200 text-sm">{value}</div>
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-gray-400">{text}</div>
      </div>
    </div>
  );
}
