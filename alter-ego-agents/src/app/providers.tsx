"use client";

import type { ReactNode } from "react";
import { NeynarContextProvider } from "@neynar/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
      }}
    >
      {children}
    </NeynarContextProvider>
  );
}