"use client";

import { useEffect, useState } from "react";

export default function AgentPage() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [targetUsername, setTargetUsername] = useState("");
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("fc_user");
    if (!stored) { setLoading(false); return; }

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

  const runSimulation = async () => {
    try {
      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");
      const resAgent = await fetch(`/api/agent/get?fid=${fcUser.fid}`);
      const dataAgent = await resAgent.json();

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentA: dataAgent.agent, agentB: dataAgent.agent }),
      });

      const data = await res.json();

      sessionStorage.setItem("sim_result", JSON.stringify(data.result));
      sessionStorage.setItem("sim_agents", JSON.stringify({ agentA: dataAgent.agent, agentB: dataAgent.agent }));

      window.location.href = "/simulate";
    } catch (err) {
      console.error(err);
      alert("Simulation failed");
    }
  };

  const runMatchSimulation = async () => {
    try {
      setLoadingMatch(true);
      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");

      const resA = await fetch(`/api/agent/get?fid=${fcUser.fid}`);
      const dataA = await resA.json();

      const resUser = await fetch(`/api/user/search?username=${targetUsername}`);
      const userData = await resUser.json();

      if (!userData.user) throw new Error("User not found");

      const targetFid = userData.user.fid;
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

      const simRes = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentA: dataA.agent, agentB: dataB.agent }),
      });

      const simData = await simRes.json();

      sessionStorage.setItem("sim_result", JSON.stringify(simData.result));
      sessionStorage.setItem("sim_agents", JSON.stringify({ agentA: dataA.agent, agentB: dataB.agent }));

      window.location.href = "/simulate";
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Match failed");
    } finally {
      setLoadingMatch(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{agentStyles}</style>
        <div className="agent-root">
          <div className="grid-overlay" />
          <div className="loading-state">
            <div className="spinner-ring" />
            <span className="loading-text">loading your agent...</span>
          </div>
        </div>
      </>
    );
  }

  if (!agent) {
    return (
      <>
        <style>{agentStyles}</style>
        <div className="agent-root">
          <div className="grid-overlay" />
          <div className="empty-state">
            <div className="empty-icon">∅</div>
            <p className="empty-label">No agent found</p>
            <button
              className="btn-ghost"
              onClick={() => { sessionStorage.clear(); window.location.href = "/"; }}
            >
              Reset &amp; Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{agentStyles}</style>
      <div className="agent-root">
        <div className="grid-overlay" />

        <div className="agent-container">

          {/* Header */}
          <div className="agent-header">
            <div className="header-tag">Your Alter Ego</div>
            <h1 className="agent-title">Digital Twin</h1>
          </div>

          {/* Trait cards */}
          <div className="traits-grid">
            <TraitCard label="Communication" value={agent.communicationStyle} color="violet" />
            <TraitCard label="Working Style" value={agent.workingStyle} color="teal" />
            <TraitCard label="Interests" value={agent.topInterests?.join(", ")} color="amber" />
            <TraitCard label="Strengths" value={agent.strengths?.join(", ") || "—"} color="green" />
            <TraitCard label="Weaknesses" value={agent.weaknesses?.join(", ") || "—"} color="rose" />
          </div>

          {/* Self-sim button */}
          <button onClick={runSimulation} className="btn-primary">
            <span>Run Self Simulation</span>
            <span className="btn-icon">⟳</span>
          </button>

          {/* Divider */}
          <div className="section-divider">
            <div className="divider-line" />
            <span className="divider-label">or match with someone</span>
            <div className="divider-line" />
          </div>

          {/* Match input */}
          <div className="match-box">
            <div className="input-wrapper">
              <span className="input-prefix">@</span>
              <input
                type="text"
                placeholder="farcaster username"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="match-input"
                onKeyDown={(e) => e.key === "Enter" && targetUsername && !loadingMatch && runMatchSimulation()}
              />
            </div>

            <button
              onClick={runMatchSimulation}
              disabled={!targetUsername || loadingMatch}
              className="btn-match"
            >
              {loadingMatch ? (
                <><div className="spinner-sm" /> Matching...</>
              ) : (
                <>Compare &amp; Simulate →</>
              )}
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={() => { sessionStorage.clear(); window.location.href = "/"; }}
            className="btn-reset"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </>
  );
}

function TraitCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    violet: "#a78bfa",
    teal: "#2dd4bf",
    amber: "#fbbf24",
    green: "#4ade80",
    rose: "#fb7185",
  };
  const c = colors[color] || colors.violet;

  return (
    <div className="trait-card" style={{ "--accent-c": c } as any}>
      <div className="trait-label">{label}</div>
      <div className="trait-value">{value}</div>
    </div>
  );
}

const agentStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  * { box-sizing: border-box; }

  :root {
    --bg: #080808;
    --surface: #0e0e0e;
    --surface2: #141414;
    --border: rgba(255,255,255,0.06);
    --border-hover: rgba(255,255,255,0.12);
    --violet: #8b5cf6;
    --violet-dim: rgba(139,92,246,0.12);
    --text: #f0f0f0;
    --muted: #4a4a4a;
    --muted2: #6a6a6a;
  }

  .agent-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Syne', sans-serif;
    color: var(--text);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 3rem 1.25rem 4rem;
    position: relative;
  }

  .agent-root::before {
    content: '';
    position: fixed;
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%);
    top: 0; left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .grid-overlay {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  .agent-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Loading / Empty */
  .loading-state, .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 100vh; gap: 1rem;
    position: relative; z-index: 10;
  }

  .spinner-ring {
    width: 36px; height: 36px;
    border: 2px solid rgba(139,92,246,0.2);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted2);
    letter-spacing: 0.1em;
    text-transform: lowercase;
  }

  .empty-icon {
    font-size: 2.5rem;
    color: var(--muted);
    line-height: 1;
  }

  .empty-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--muted2);
  }

  /* Header */
  .agent-header {
    margin-bottom: 0.25rem;
  }

  .header-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8b5cf6;
    background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.25);
    border-radius: 999px;
    padding: 4px 12px;
    margin-bottom: 0.75rem;
  }

  .agent-title {
    font-size: clamp(2rem, 6vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    background: linear-gradient(160deg, #f0f0f0 30%, #555 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Traits */
  .traits-grid {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .trait-card {
    background: var(--surface);
    padding: 14px 18px;
    display: flex;
    gap: 14px;
    align-items: baseline;
    transition: background 0.15s;
    position: relative;
  }

  .trait-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--accent-c, #8b5cf6);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .trait-card:hover {
    background: var(--surface2);
  }

  .trait-card:hover::before {
    opacity: 1;
  }

  .trait-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-c, #8b5cf6);
    min-width: 110px;
    flex-shrink: 0;
  }

  .trait-value {
    font-size: 0.85rem;
    color: rgba(240,240,240,0.8);
    line-height: 1.5;
  }

  /* Buttons */
  .btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: #8b5cf6;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 15px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(139,92,246,0.25);
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 32px rgba(139,92,246,0.4);
  }

  .btn-icon { font-size: 1.1rem; }

  /* Section divider */
  .section-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0.25rem 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: lowercase;
    color: var(--muted);
    white-space: nowrap;
  }

  /* Match box */
  .match-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: rgba(139,92,246,0.4);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.06);
  }

  .input-prefix {
    padding: 0 0 0 16px;
    font-family: 'DM Mono', monospace;
    font-size: 1rem;
    color: var(--muted2);
    user-select: none;
  }

  .match-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 14px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    color: var(--text);
  }

  .match-input::placeholder {
    color: var(--muted);
  }

  .btn-match {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-match:hover:not(:disabled) {
    border-color: rgba(139,92,246,0.35);
    background: rgba(139,92,246,0.08);
    color: #c4b5fd;
  }

  .btn-match:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spinner-sm {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(255,255,255,0.2);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Ghost + Reset */
  .btn-ghost, .btn-reset {
    background: none;
    border: none;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    cursor: pointer;
    letter-spacing: 0.08em;
    text-decoration: underline;
    transition: color 0.2s;
    text-align: center;
  }

  .btn-ghost:hover, .btn-reset:hover { color: var(--muted2); }

  .btn-reset { margin-top: 0.25rem; }
`;