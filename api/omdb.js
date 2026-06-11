export default async function handler(req, res) {
    const OMDB_KEY = process.env.OMDB_KEY;
    
     
    // If URL is "/api/omdb?t=Cars&y=2006", this extracts "t=Cars&y=2006"
    const queryString = req.url.split('?')[1] || '';
    
    const url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&${queryString}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'OMDb API error' });
        }
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from OMDb', message: error.message });
    }
}