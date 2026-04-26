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

  // 🔥 KEY: controls whether user explicitly started login
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Only proceed if BOTH user exists AND user clicked connect
    if (!user || !hasStarted) return;

    const createAgent = async () => {
      setStage("creating");

      // store user for later pages
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center max-w-md">

        <h1 className="text-5xl font-bold mb-4">
          Alter Ego <span className="text-purple-400">Agents</span>
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          Your Farcaster casts become an AI agent. Meet someone new — your agents talk first.
        </p>

        {/* 🟣 STEP 1: Always show clean connect button */}
        {!hasStarted && (
          <button
            onClick={() => {
              setHasStarted(true);
              setStage("authenticating");
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Connect Farcaster →
          </button>
        )}

        {/* 🟣 STEP 2: Only AFTER click → show Neynar login */}
        {hasStarted && stage === "authenticating" && (
          <div className="flex flex-col items-center gap-4">
            <NeynarAuthButton />
            {!user && (
              <p className="text-gray-400 text-sm">
                Waiting for Farcaster login...
              </p>
            )}
          </div>
        )}

        {/* ⚙️ STEP 3: Agent creation */}
        {stage === "creating" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">
              Building your alter ego... (~15s)
            </p>
          </div>
        )}

        {/* ❌ ERROR */}
        {stage === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
              {errorMsg}
            </div>

            <button
              onClick={() => {
                setStage("idle");
                setHasStarted(false);
              }}
              className="text-sm text-gray-400 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Reads your last 40 casts · No personal data stored
      </p>
    </main>
  );
}