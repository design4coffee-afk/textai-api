export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        res.status(200).end()
        return
    }

    if (req.method !== "POST") {
        res.status(405).end()
        return
    }

    const { text } = req.body
    if (!text) return res.status(400).json({ error: "Missing text" })

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: text }],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        })
        const data = await response.json()
        res.status(200).json({ result: data.choices[0].message.content.trim() })
    } catch (e) {
        res.status(500).json({ error: "Server error" })
    }
}
