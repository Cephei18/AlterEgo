"use client";

import { useEffect, useState } from "react";
import type { SimulationResult } from "../../lib/types";
import { getScoreColor, getScoreVerb } from "../../lib/scoreHelpers";

export default function SimulatePage() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [agents, setAgents] = useState<any>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const r = sessionStorage.getItem("sim_result");
    const a = sessionStorage.getItem("sim_agents");
    if (r) setResult(JSON.parse(r));
    if (a) setAgents(JSON.parse(a));
  }, []);

  const shareToFarcaster = async () => {
    if (!result || !agents) return;
    setSharing(true);
    setShareError("");

    try {
      const fcUser = JSON.parse(sessionStorage.getItem("fc_user") || "{}");
      const signerUuid = fcUser.signerUuid;

      if (!signerUuid) throw new Error("Reconnect Farcaster from home.");

      const res = await fetch("/api/cast/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          usernameA: agents.agentA.username,
          usernameB: agents.agentB.username,
          signerUuid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");
      setShared(true);
    } catch (e: any) {
      setShareError(e.message || "Something went wrong");
    } finally {
      setSharing(false);
    }
  };

  if (!result) {
    return (
      <>
        <style>{simStyles}</style>
        <div className="sim-root">
          <div className="grid-overlay" />
          <div className="sim-loading">
            <div className="spinner-ring" />
            <span className="loading-text">loading result...</span>
          </div>
        </div>
      </>
    );
  }

  // Derive score tier for theming
  const score = result.compatibilityScore;
  const scoreTier = score >= 80 ? "high" : score >= 50 ? "mid" : "low";

  return (
    <>
      <style>{simStyles}</style>
      <div className="sim-root">
        <div className="grid-overlay" />

        <div className="sim-container">

          {/* SCORE HERO */}
          <div className="score-hero" data-tier={scoreTier}>
            <div className="score-glow" data-tier={scoreTier} />
            <div className={`score-number ${getScoreColor(result.compatibilityScore)}`}>
              {result.compatibilityScore}
            </div>
            <div className="score-verb">{getScoreVerb(result.compatibilityScore)}</div>
            <div className="score-label">{result.compatibilityLabel}</div>
            {agents && (
              <div className="score-pair">
                <span className="pair-name">@{agents.agentA.username}</span>
                <span className="pair-sep">↔</span>
                <span className="pair-name">@{agents.agentB.username}</span>
              </div>
            )}
          </div>

          {/* COLLAB STYLE */}
          <div className="result-card" data-accent="violet">
            <div className="card-eyebrow violet">How you'd work</div>
            <p className="card-body">{result.collaborationStyle}</p>
          </div>

          {/* TALKING POINTS */}
          <div className="result-card" data-accent="green">
            <div className="card-eyebrow green">Talking points</div>
            <div className="talking-list">
              {result.talkingPoints.map((pt, i) => (
                <div key={i} className="talking-item">
                  <span className="talking-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="talking-text">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RISK FLAG */}
          <div className="result-card" data-accent="orange">
            <div className="card-eyebrow orange">Watch out</div>
            <p className="card-body">{result.riskFlag}</p>
          </div>

          {/* SIMULATION CHAT */}
          <div className="chat-card">
            <div className="chat-header">
              <span className="chat-label">Simulation</span>
              <div className="chat-dots">
                <span /><span /><span />
              </div>
            </div>
            <div className="chat-messages">
              {result.simulationExcerpt.split("\n").filter(Boolean).map((line, i) => {
                const isA = line.startsWith("A:");
                return (
                  <div
                    key={i}
                    className={`chat-bubble-row ${isA ? "row-left" : "row-right"}`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    {isA && <div className="avatar avatar-a">A</div>}
                    <div className={`chat-bubble ${isA ? "bubble-a" : "bubble-b"}`}>
                      {line}
                    </div>
                    {!isA && <div className="avatar avatar-b">B</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHARE BUTTON */}
          <button
            onClick={shareToFarcaster}
            disabled={sharing || shared}
            className={`btn-share ${shared ? "is-shared" : ""}`}
          >
            {shared ? (
              <><span className="share-check">✓</span> Shared to Farcaster</>
            ) : sharing ? (
              <><div className="spinner-sm" /> Sharing...</>
            ) : (
              <>Share to Farcaster →</>
            )}
          </button>

          {shareError && (
            <p className="share-error">{shareError}</p>
          )}
        </div>
      </div>
    </>
  );
}

const simStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  * { box-sizing: border-box; }

  :root {
    --bg: #080808;
    --surface: #0e0e0e;
    --surface2: #141414;
    --border: rgba(255,255,255,0.06);
    --text: #f0f0f0;
    --muted: #4a4a4a;
    --muted2: #6a6a6a;

    --violet: #a78bfa;
    --green: #4ade80;
    --orange: #fb923c;
    --teal: #2dd4bf;
  }

  .sim-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Syne', sans-serif;
    color: var(--text);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 3rem 1.25rem 5rem;
    position: relative;
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

  .sim-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
    position: relative;
    z-index: 10;
  }

  .spinner-ring {
    width: 36px; height: 36px;
    border: 2px solid rgba(139,92,246,0.2);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner-sm {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted2);
    letter-spacing: 0.1em;
  }

  .sim-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* SCORE HERO */
  .score-hero {
    position: relative;
    text-align: center;
    padding: 3rem 2rem 2.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
  }

  .score-glow {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    pointer-events: none;
  }

  .score-glow[data-tier="high"] {
    background: radial-gradient(ellipse at 50% 0%, rgba(74,222,128,0.06) 0%, transparent 65%);
    border-color: rgba(74,222,128,0.12);
  }

  .score-glow[data-tier="mid"] {
    background: radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 65%);
  }

  .score-glow[data-tier="low"] {
    background: radial-gradient(ellipse at 50% 0%, rgba(248,113,113,0.06) 0%, transparent 65%);
  }

  .score-number {
    font-size: clamp(5rem, 18vw, 8rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 0.25rem;
    position: relative;
  }

  .score-verb {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 0.5rem;
  }

  .score-label {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 1rem;
  }

  .score-pair {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 16px;
  }

  .pair-name {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted2);
    letter-spacing: 0.03em;
  }

  .pair-sep {
    color: var(--muted);
    font-size: 0.8rem;
  }

  /* Result Cards */
  .result-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem 1.4rem;
    transition: border-color 0.2s;
  }

  .result-card:hover {
    border-color: rgba(255,255,255,0.1);
  }

  .card-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }

  .card-eyebrow.violet { color: var(--violet); }
  .card-eyebrow.green  { color: var(--green); }
  .card-eyebrow.orange { color: var(--orange); }

  .card-body {
    font-size: 0.88rem;
    line-height: 1.7;
    color: rgba(240,240,240,0.75);
  }

  /* Talking points */
  .talking-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .talking-item {
    display: flex;
    gap: 14px;
    align-items: baseline;
  }

  .talking-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    color: var(--green);
    opacity: 0.6;
    flex-shrink: 0;
    letter-spacing: 0.05em;
  }

  .talking-text {
    font-size: 0.88rem;
    line-height: 1.6;
    color: rgba(240,240,240,0.75);
  }

  /* Chat */
  .chat-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .chat-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted2);
  }

  .chat-dots {
    display: flex;
    gap: 5px;
  }

  .chat-dots span {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--border);
  }

  .chat-dots span:nth-child(1) { background: rgba(248,113,113,0.4); }
  .chat-dots span:nth-child(2) { background: rgba(251,191,36,0.4); }
  .chat-dots span:nth-child(3) { background: rgba(74,222,128,0.4); }

  .chat-messages {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chat-bubble-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    animation: bubbleFade 0.4s ease both;
  }

  .row-left  { justify-content: flex-start; }
  .row-right { justify-content: flex-end; }

  @keyframes bubbleFade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    font-weight: 600;
    flex-shrink: 0;
    letter-spacing: 0;
  }

  .avatar-a {
    background: rgba(167,139,250,0.15);
    border: 1px solid rgba(167,139,250,0.25);
    color: #a78bfa;
  }

  .avatar-b {
    background: rgba(45,212,191,0.12);
    border: 1px solid rgba(45,212,191,0.2);
    color: #2dd4bf;
  }

  .chat-bubble {
    max-width: 76%;
    padding: 9px 13px;
    border-radius: 12px;
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .bubble-a {
    background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.18);
    color: rgba(196,181,253,0.9);
    border-bottom-left-radius: 4px;
  }

  .bubble-b {
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.15);
    color: rgba(94,234,212,0.9);
    border-bottom-right-radius: 4px;
  }

  /* Share button */
  .btn-share {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: #8b5cf6;
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 16px;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(139,92,246,0.25);
  }

  .btn-share::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
  }

  .btn-share:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(139,92,246,0.4);
  }

  .btn-share.is-shared {
    background: #16a34a;
    box-shadow: 0 4px 24px rgba(22,163,74,0.25);
    cursor: default;
  }

  .btn-share:disabled:not(.is-shared) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .share-check {
    font-size: 1rem;
  }

  .share-error {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: #f87171;
    text-align: center;
    letter-spacing: 0.03em;
    padding: 10px;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.15);
    border-radius: 10px;
  }
`;