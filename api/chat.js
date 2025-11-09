export default async function handler(req, res) {
  // CORS so your static site (GitHub Pages etc.) can call this API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request
    return res.status(200).end();
  }

  // Only allow POST for real calls
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }

    const systemPrompt = `
You are GradGoGlobal AI, the assistant for a platform connecting U.S.-trained international graduates
with employers outside the United States.

Your rules:
- Make it clear GradGoGlobal focuses ONLY on non-U.S. roles.
- Highlight AI-driven matching: role, skills, tech stack, relocation readiness.
- For recruiters: ask structured questions (role, location, stack, seniority, timeline).
- For students: explain how to join the waitlist and supported regions.
- Do NOT give legal immigration advice or guarantees. Suggest checking official sources.
- Be concise, clear, and professional.
    `.trim();

    const safeHistory = Array.isArray(history) ? history : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...safeHistory,
      { role: "user", content: message }
    ];

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return res.status(500).json({ error: "Server misconfigured." });
    }

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "Upstream AI error." });
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
