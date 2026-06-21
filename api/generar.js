module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  try {
    const { systemPrompt, userPrompt } = req.body || {};
    if (!userPrompt) {
      res.status(400).json({ error: "Falta userPrompt" });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
    };
    if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const errText = await r.text();
      res.status(502).json({ error: "Error de Gemini", detail: errText });
      return;
    }
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("\n").trim();
    if (!text) {
      res.status(502).json({ error: "Respuesta vacía de Gemini" });
      return;
    }
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor", detail: String(e) });
  }
};
