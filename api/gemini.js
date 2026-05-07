export default async function handler(req, res) {
    // Only allow four frontend to POST data to this secure route
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

        const { prompt } = req.body
        const apiKey = process.env.GEMINI_API_KEY

        try {
            // Forward the request to Google's Gemini servers securely
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{parts: [{ text: prompt }] }]
                })
            })

            const data = await response.json()
            res.status(200).json(data) // Send the AI's answer back to the frontend
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Failed to fetch AI' })
        }
    
}