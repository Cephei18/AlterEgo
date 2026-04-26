"use client";

import { useEffect, useState } from "react";

export default function AgentPage() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW
  const [targetUsername, setTargetUsername] = useState("");
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("fc_user");

    if (!stored) {
      setLoading(false);
      return;
    }

    const user = JSON.parse(stored);

    const fetchAgent = async () => {
      try {
        const res = await fetch("/api/agent/get?fid=" + user.fid);
        const data = await res.json();
        setAgent(data.agent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, []);

  // 🔥 SELF SIMULATION
  const runSimulation = async () => {
    try {
      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");

      const resAgent = await fetch(`/api/agent/get?fid=${fcUser.fid}`);
      const dataAgent = await resAgent.json();

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentA: dataAgent.agent,
          agentB: dataAgent.agent,
        }),
      });

      const data = await res.json();

      sessionStorage.setItem("sim_result", JSON.stringify(data.result));
      sessionStorage.setItem(
        "sim_agents",
        JSON.stringify({
          agentA: dataAgent.agent,
          agentB: dataAgent.agent,
        })
      );

      window.location.href = "/simulate";
    } catch (err) {
      console.error(err);
      alert("Simulation failed");
    }
  };

  // 🔥 MATCH SIMULATION (MAIN FEATURE)
  const runMatchSimulation = async () => {
    try {
      setLoadingMatch(true);

      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");

      // 1️⃣ Your agent
      const resA = await fetch(`/api/agent/get?fid=${fcUser.fid}`);
      const dataA = await resA.json();

      // 2️⃣ Find user
      const resUser = await fetch(`/api/user/search?username=${targetUsername}`);
      const userData = await resUser.json();

      if (!userData.user) throw new Error("User not found");

      const targetFid = userData.user.fid;

      // 3️⃣ Get/create their agent
      let resB = await fetch(`/api/agent/get?fid=${targetFid}`);
      let dataB = await resB.json();

      if (!dataB.agent) {
        await fetch("/api/agent/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: targetFid }),
        });

        resB = await fetch(`/api/agent/get?fid=${targetFid}`);
        dataB = await resB.json();
      }

      // 4️⃣ Simulate
      const simRes = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentA: dataA.agent,
          agentB: dataB.agent,
        }),
      });

      const simData = await simRes.json();

      sessionStorage.setItem("sim_result", JSON.stringify(simData.result));
      sessionStorage.setItem(
        "sim_agents",
        JSON.stringify({
          agentA: dataA.agent,
          agentB: dataB.agent,
        })
      );

      window.location.href = "/simulate";
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Match failed");
    } finally {
      setLoadingMatch(false);
    }
  };

  // 🔥 LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading your agent...
      </div>
    );
  }

  // 🔥 NO AGENT
  if (!agent) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p>No agent found</p>

        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.href = "/";
          }}
          className="text-sm underline text-gray-400"
        >
          Reset & Try Again
        </button>
      </div>
    );
  }

  // 🔥 MAIN UI
  return (
    <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
      <div className="max-w-xl w-full text-center">

        <h1 className="text-4xl font-bold mb-6">
          Your Alter Ego 🧬
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <p><span className="text-purple-400">Communication:</span> {agent.communicationStyle}</p>
          <p><span className="text-purple-400">Working Style:</span> {agent.workingStyle}</p>
          <p><span className="text-purple-400">Interests:</span> {agent.topInterests?.join(", ")}</p>
          <p><span className="text-purple-400">Strengths:</span> {agent.strengths?.join(", ") || "—"}</p>
          <p><span className="text-purple-400">Weaknesses:</span> {agent.weaknesses?.join(", ") || "—"}</p>
        </div>

        {/* 🔥 SELF SIMULATION */}
        <button
          onClick={runSimulation}
          className="mt-6 bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-semibold"
        >
          Run Simulation →
        </button>

        {/* 🔥 MATCH INPUT */}
        <input
          type="text"
          placeholder="Enter Farcaster username (e.g. dwr)"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          className="mt-6 w-full px-4 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 outline-none"
        />

        {/* 🔥 MATCH BUTTON */}
        <button
          onClick={runMatchSimulation}
          disabled={!targetUsername || loadingMatch}
          className="mt-3 bg-purple-600 px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {loadingMatch ? "Matching..." : "Match with user →"}
        </button>

        {/* 🔥 RESET */}
        <button
          onClick={() => {
            sessionStorage.clear();
            window.location.href = "/";
          }}
          className="mt-4 text-xs text-gray-500 underline hover:text-gray-300"
        >
          Reset Demo
        </button>

      </div>
    </main>
  );
}