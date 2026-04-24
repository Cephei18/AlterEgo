import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return client;
}

export async function callLLM(prompt: string, maxTokens = 2048): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    generationConfig: { maxOutputTokens: maxTokens }
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
