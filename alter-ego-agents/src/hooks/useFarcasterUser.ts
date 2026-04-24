"use client";

import { useEffect, useState } from "react";
import type { FarcasterUser } from "../lib/types";

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/farcaster");
        const data = await response.json();
        if (active && data?.user) {
          setUser(data.user as FarcasterUser);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
