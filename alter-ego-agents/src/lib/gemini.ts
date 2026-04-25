export async function callLLM(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error("Gemini API error: " + error);
  }

  const data = await res.json();

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}