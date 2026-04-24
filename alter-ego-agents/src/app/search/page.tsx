"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const searchUser = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/user/search?username=${query.replace("@", "")}`);
      const data = await res.json();
      if (!data.user) throw new Error("User not found");
      setTargetUser(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const runSimulation = async () => {
    const userStr = sessionStorage.getItem("fc_user");
    if (!userStr || !targetUser) return;

    const currentUser = JSON.parse(userStr) as { fid: number };
    setSimulating(true);

    await fetch("/api/agent/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid: targetUser.fid })
    });

    const [myAgentRes, theirAgentRes] = await Promise.all([
      fetch(`/api/agent/get?fid=${currentUser.fid}`),
      fetch(`/api/agent/get?fid=${targetUser.fid}`)
    ]);

    const [myAgent, theirAgent] = await Promise.all([myAgentRes.json(), theirAgentRes.json()]);

    const simRes = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentA: myAgent.agent, agentB: theirAgent.agent })
    });

    const simData = await simRes.json();

    sessionStorage.setItem("sim_result", JSON.stringify(simData.result));
    sessionStorage.setItem(
      "sim_agents",
      JSON.stringify({
        agentA: myAgent.agent,
        agentB: theirAgent.agent
      })
    );

    router.push("/simulate");
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Find a collaborator</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUser()}
          placeholder="@username"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={searchUser}
          disabled={searching}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

      {targetUser && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={targetUser.pfp_url} alt={targetUser.display_name} className="w-12 h-12 rounded-full" />
            <div>
              <div className="font-semibold">{targetUser.display_name}</div>
              <div className="text-gray-400 text-sm">@{targetUser.username}</div>
            </div>
          </div>
          {targetUser.profile?.bio?.text && (
            <p className="text-gray-400 text-sm mb-4">{targetUser.profile.bio.text}</p>
          )}
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-all"
          >
            {simulating
              ? "Agents are talking... (~15s)"
              : `Simulate with @${targetUser.username} ${"->"}`}
          </button>
        </div>
      )}
    </main>
  );
}
