// NEW
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

let client: NeynarAPIClient | null = null;

export function getNeynarClient(): NeynarAPIClient {
  if (!client) {
    client = new NeynarAPIClient(
      new Configuration({ apiKey: process.env.NEYNAR_API_KEY! })
    );
  }
  return client;
}