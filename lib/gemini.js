export async function generateSummary(bodyText) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || !bodyText?.trim()) {
      return null;
    }

    const prompt =
      "Generate a concise 200-word summary of the following blog post: " +
      bodyText;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
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
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}
