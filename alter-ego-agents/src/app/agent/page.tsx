"use client";

import { useEffect, useState } from "react";

export default function AgentPage() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("fc_user");
    if (!stored) return;

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

  // 🔥 ADD THIS FUNCTION INSIDE COMPONENT
  const runSimulation = async () => {
    try {
      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");

      const resAgent = await fetch(`/api/agent/get?fid=${fcUser.fid}`);
      const dataAgent = await resAgent.json();

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentA: dataAgent.agent,
          agentB: dataAgent.agent // same for now
        })
      });

      const data = await res.json();

      sessionStorage.setItem("sim_result", JSON.stringify(data.result));
      sessionStorage.setItem("sim_agents", JSON.stringify({
        agentA: dataAgent.agent,
        agentB: dataAgent.agent
      }));

      window.location.href = "/simulate";

    } catch (err) {
      console.error(err);
      alert("Simulation failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading your agent...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No agent found
      </div>
    );
  }

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
          <p><span className="text-purple-400">Strengths:</span> {agent.strengths?.join(", ")}</p>
          <p><span className="text-purple-400">Weaknesses:</span> {agent.weaknesses?.join(", ")}</p>

        </div>

        {/* 🔥 BUTTON INSIDE RETURN */}
        <button
          onClick={runSimulation}
          className="mt-6 bg-purple-600 px-6 py-3 rounded-lg"
        >
          Run Simulation →
        </button>

      </div>
    </main>
  );
}