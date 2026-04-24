"use client";

import { useState } from "react";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
}

export default function ConnectButton({ onConnect }: { onConnect?: (user: FarcasterUser) => void }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);

    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/farcaster`;
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const popup = window.open(authUrl, "neynar-auth", "width=500,height=700");

    window.addEventListener(
      "message",
      async (e) => {
        if (e.data?.type === "neynar_auth_success") {
          const { fid, username, displayName, pfpUrl, bio } = e.data;
          popup?.close();
          onConnect?.({ fid, username, displayName, pfpUrl, bio });
          setLoading(false);
        }
      },
      { once: true }
    );
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
      type="button"
    >
      {loading ? "Connecting..." : "Connect Farcaster"}
    </button>
  );
}
