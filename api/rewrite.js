const rateLimit = new Map()

function isRateLimited(ip) {
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 phút
    const maxRequests = 10 // tối đa 10 request/phút/IP

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, start: now })
        return false
    }

    const data = rateLimit.get(ip)

    if (now - data.start > windowMs) {
        rateLimit.set(ip, { count: 1, start: now })
        return false
    }

    if (data.count >= maxRequests) return true

    data.count++
    return false
}

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

    // Rate limit theo IP
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Quá nhiều request, thử lại sau 1 phút." })
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
