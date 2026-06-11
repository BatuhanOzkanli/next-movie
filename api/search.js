export default async function handler(req, res) {
    const { term } = req.body; // Get data from frontend
    const OMDB_KEY = process.env.OMDB_KEY;

    try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(term)}&type=movie`);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'OMDb failed' });
    }
}