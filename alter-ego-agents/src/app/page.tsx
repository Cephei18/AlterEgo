"use client";

import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "idle" | "creating" | "error";

export default function HomePage() {
  const { user } = useNeynarContext();
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 40000);

        const res = await fetch("/api/agent/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: user.fid }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Server error " + res.status);
        }

        router.push("/agent");
      } catch (err: any) {
        setErrorMsg(
          err.name === "AbortError"
            ? "Took too long. Check GEMINI_API_KEY in .env.local"
            : err.message || "Something went wrong"
        );
        setStage("error");
      }
    };

    createAgent();
  }, [user]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4">
          Alter Ego <span className="text-purple-400">Agents</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Your Farcaster casts become an AI agent. Meet someone new — your agents talk first.
        </p>

        {stage === "idle" && <NeynarAuthButton />}

        {stage === "creating" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">
              Building your alter ego... (~15s)
            </p>
          </div>
        )}

        {stage === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
              {errorMsg}
            </div>
            <button
              onClick={() => setStage("idle")}
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