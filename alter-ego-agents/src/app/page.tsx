"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

// Three distinct stages so the user always knows what's happening
type Stage = "idle" | "connecting" | "creating" | "error";

export default function HomePage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleConnect = async (user: FarcasterUser) => {
    sessionStorage.setItem("fc_user", JSON.stringify(user));
    setStage("creating");

    try {
      const controller = new AbortController();
      // Gemini free tier can be slow — give it 40s before giving up
      const timeout = setTimeout(() => controller.abort(), 40_000);

      const res = await fetch("/api/agent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: user.fid }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      router.push("/agent");
    } catch (err: any) {
      const msg =
        err.name === "AbortError"
          ? "Gemini took too long. Check your GEMINI_API_KEY in .env.local and try again."
          : err.message || "Something went wrong";
      setErrorMsg(msg);
      setStage("error");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4">
          Alter Ego <span className="text-purple-400">Agents</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Your Farcaster casts become an AI agent. Meet someone new — your agents talk first.
        </p>

        <ConnectButton stage={stage} setStage={setStage} onConnect={handleConnect} />

        {stage === "error" && (
          <div className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
            {errorMsg}
            <button
              onClick={() => setStage("idle")}
              className="ml-3 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {stage === "creating" && (
          <p className="mt-4 text-gray-500 text-sm animate-pulse">
            Reading your casts and building your alter ego… (~15s)
          </p>
        )}
      </div>

      <div className="text-xs text-gray-600 text-center">
        Reads your last 40 casts · No personal data stored · Results shareable
      </div>
    </main>
  );
}

function ConnectButton({
  stage,
  setStage,
  onConnect,
}: {
  stage: Stage;
  setStage: (s: Stage) => void;
  onConnect: (u: FarcasterUser) => void;
}) {
  const handleClick = () => {
    setStage("connecting");

    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/farcaster`);
    const url = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${redirectUri}`;

    const popup = window.open(url, "fc-auth", "width=480,height=700,left=200,top=100");

    const messageHandler = (e: MessageEvent) => {
      if (e.data?.type === "neynar_auth_success") {
        cleanup();
        // popup closes itself via window.close() in the auth callback route
        onConnect(e.data as FarcasterUser);
      }
      if (e.data?.type === "neynar_auth_error") {
        cleanup();
        setStage("idle");
      }
    };

    window.addEventListener("message", messageHandler);

    // Fallback: poll localStorage in case postMessage is blocked (e.g. Safari)
    const pollTimer = setInterval(() => {
      try {
        const stored = localStorage.getItem("fc_auth_result");
        if (stored) {
          localStorage.removeItem("fc_auth_result");
          cleanup();
          onConnect(JSON.parse(stored) as FarcasterUser);
          return;
        }
      } catch {}

      // User closed popup manually without completing auth
      if (popup?.closed) {
        cleanup();
        setStage("idle");
      }
    }, 500);

    function cleanup() {
      clearInterval(pollTimer);
      window.removeEventListener("message", messageHandler);
    }
  };

  const isLoading = stage === "connecting" || stage === "creating";

  const label =
    stage === "connecting"
      ? "Waiting for Farcaster…"
      : stage === "creating"
      ? "Building your alter ego…"
      : stage === "error"
      ? "Connect Farcaster →"
      : "Connect Farcaster →";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all w-full flex items-center justify-center gap-3"
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {label}
    </button>
  );
}