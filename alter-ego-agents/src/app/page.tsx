"use client";

import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "idle" | "authenticating" | "creating" | "error";

export default function HomePage() {
  const { user } = useNeynarContext();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!user || !hasStarted) return;

    const createAgent = async () => {
      setStage("creating");

      sessionStorage.setItem(
        "fc_user",
        JSON.stringify({
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
          signerUuid: user.signer_uuid,
        })
      );

      try {
        const res = await fetch("/api/agent/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: user.fid }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Agent creation failed");
        }

        router.push("/agent");
      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong");
        setStage("error");
      }
    };

    createAgent();
  }, [user, hasStarted]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --surface: #101010;
          --border: rgba(255,255,255,0.07);
          --border-lit: rgba(139,92,246,0.4);
          --violet: #8b5cf6;
          --violet-dim: rgba(139,92,246,0.15);
          --violet-glow: rgba(139,92,246,0.06);
          --text: #f0f0f0;
          --muted: #5a5a5a;
          --accent: #a78bfa;
        }

        .home-root {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'Syne', sans-serif;
          color: var(--text);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient orbs */
        .home-root::before {
          content: '';
          position: fixed;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          top: -150px; left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          border-radius: 50%;
        }
        .home-root::after {
          content: '';
          position: fixed;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,60,220,0.05) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none;
          border-radius: 50%;
        }

        /* Grid texture */
        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .home-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
          text-align: center;
          animation: fadeUp 0.7s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--violet);
          background: var(--violet-dim);
          border: 1px solid var(--border-lit);
          border-radius: 999px;
          padding: 5px 14px;
          margin-bottom: 2rem;
        }

        .eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--violet);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .home-title {
          font-size: clamp(2.8rem, 8vw, 4.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }

        .home-title em {
          font-style: normal;
          background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 60%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-desc {
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.75;
          margin-bottom: 2.5rem;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-connect {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--violet);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 32px;
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 4px 20px rgba(139,92,246,0.3);
          position: relative;
          overflow: hidden;
        }

        .btn-connect::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .btn-connect:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 4px rgba(139,92,246,0.15), 0 8px 30px rgba(139,92,246,0.45);
        }

        .btn-connect:active {
          transform: translateY(0);
        }

        .btn-arrow {
          font-size: 1.1rem;
          transition: transform 0.2s;
        }

        .btn-connect:hover .btn-arrow {
          transform: translateX(4px);
        }

        /* Auth state */
        .auth-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .auth-hint {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.05em;
        }

        /* Creating state */
        .creating-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .spinner-ring {
          width: 40px; height: 40px;
          border: 2px solid rgba(139,92,246,0.2);
          border-top-color: var(--violet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .creating-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          animation: breathe 2s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Error state */
        .error-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .error-msg {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: #f87171;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px;
          padding: 12px 20px;
          line-height: 1.5;
          max-width: 320px;
        }

        .btn-retry {
          background: none;
          border: none;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          cursor: pointer;
          text-decoration: underline;
          letter-spacing: 0.04em;
          transition: color 0.2s;
        }

        .btn-retry:hover { color: var(--text); }

        /* Footer note */
        .footer-note {
          position: fixed;
          bottom: 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.12);
          text-transform: uppercase;
          text-align: center;
        }

        /* Divider lines */
        .divider {
          width: 40px;
          height: 1px;
          background: var(--border);
          margin: 2rem auto;
        }
      `}</style>

      <div className="home-root">
        <div className="grid-overlay" />

        <div className="home-card">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Farcaster · AI Agents
          </div>

          <h1 className="home-title">
            Alter<br /><em>Ego</em>
          </h1>

          <p className="home-desc">
            Your casts become an AI agent.<br />
            Meet someone new — your agents talk first.
          </p>

          <div className="divider" />

          {!hasStarted && (
            <button
              className="btn-connect"
              onClick={() => {
                setHasStarted(true);
                setStage("authenticating");
              }}
            >
              Connect Farcaster
              <span className="btn-arrow">→</span>
            </button>
          )}

          {hasStarted && stage === "authenticating" && (
            <div className="auth-box">
              <NeynarAuthButton />
              {!user && <p className="auth-hint">waiting for farcaster login...</p>}
            </div>
          )}

          {stage === "creating" && (
            <div className="creating-box">
              <div className="spinner-ring" />
              <p className="creating-label">building your alter ego — ~15s</p>
            </div>
          )}

          {stage === "error" && (
            <div className="error-box">
              <div className="error-msg">{errorMsg}</div>
              <button
                className="btn-retry"
                onClick={() => { setStage("idle"); setHasStarted(false); }}
              >
                try again
              </button>
            </div>
          )}
        </div>

        <p className="footer-note">reads your last 40 casts · no personal data stored</p>
      </div>
    </>
  );
}