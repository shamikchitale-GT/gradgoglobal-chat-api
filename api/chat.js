api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [] } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const systemPrompt = `
You are GradGoGlobal AI, the assistant for a platform connecting U.S.-trained international graduates
with employers outside the U.S. Only discuss non-U.S. hiring, relocation, and skill-based matching.
Be professional, helpful, concise.
    `.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.6,
        max_tokens: 400
      })
    });

    const data = await ai.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
