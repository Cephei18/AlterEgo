import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";

let client: NeynarAPIClient | null = null;

export function getNeynarClient(): NeynarAPIClient {
  if (!client) {
    const config = new Configuration({
      apiKey: process.env.NEYNAR_API_KEY!
    });
    client = new NeynarAPIClient(config);
  }

  return client;
}
