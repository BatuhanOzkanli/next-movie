export default async function handler(req, res) {
    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_KEY;
    
    // Updated to the correct, modern, stable Gemini 2.5 Flash model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: 'Gemini API error', details: errorData });
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        res.status(200).json({ text: generatedText });
    } catch (error) {
        res.status(500).json({ error: 'Gemini failed', message: error.message });
    }
}