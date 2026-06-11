# NextMovie 🍿✨

**[Live Demo](https://nextmovie-v4.vercel.app/)**

NextMovie is an AI-powered movie discovery and watchlist application. It goes beyond standard title searches by allowing users to search for movies based on "moods" or "vibes," get instant AI summaries without spoilers, and randomly select their next watch using a custom roulette wheel. All data is seamlessly synced across devices using an anonymous key system backed by Firebase.

## ✨ Features

* **AI Mood Search:** Don't know what you want to watch? Type a mood (e.g., *"Sad 90s sci-fi"*), and Google Gemini will recommend 10 perfect matches.
* **Smart Search & Typo Correction:** Standard title search powered by OMDb. If a search yields zero results, Gemini steps in to detect typos and automatically corrects your query.
* **"Vibe Check" Integration:** Click the magic wand icon on any movie card to get a spoiler-free, 2-sentence breakdown of the movie's atmosphere and style.
* **Watchlist Roulette:** Can't decide what to watch from your list? Spin the interactive roulette wheel to pick a random unwatched movie.
* **AI Next Watch Recommendation:** Analyzes your current watchlist and recommends a brand-new movie tailored to your specific taste profile.
* **Device Syncing:** No accounts required. The app generates a unique Sync Key. Enter that key on any other device (or share it with a friend) to sync your watchlist in real-time via Firebase Firestore.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5 |
| **Styling** | Tailwind CSS (via PostCSS/CLI) |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **Database & Auth** | Firebase Firestore, Firebase Anonymous Auth |
| **External APIs** | Google Gemini 2.5 Flash API, OMDb API |
| **Deployment** | Vercel |

## 📁 Project Structure

```text
├── api/                  # Vercel Serverless Functions (Backend)
│   ├── gemini.js         # Handles prompts to the Gemini 2.5 API
│   ├── omdb.js           # Securely fetches movie data/ratings
│   └── search.js         # Dedicated OMDB search handler
├── public/               # Frontend Assets
│   ├── index.html        # Main application UI
│   ├── script.js         # Core application logic, Firebase config, & state management
│   └── style.css         # Custom animations and base styling
├── input.css             # Tailwind source directives
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Project dependencies and build scripts
```

## 🚀 Running Locally

Because this project uses Vercel Serverless Functions (`/api`), you will need to use the Vercel CLI to run it locally so the backend routes work correctly.

### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* An API key from [OMDb](https://www.omdbapi.com/apikey.aspx).
* An API key from [Google Gemini](https://aistudio.google.com/).

### 2. Installation
Clone the repository and install the development dependencies (Tailwind):

```bash
git clone [https://github.com/YOUR-USERNAME/nextmovie.git](https://github.com/YOUR-USERNAME/nextmovie.git)
cd nextmovie
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of your project and add your API keys. *Note: Do not commit this file to GitHub!*

```env
GEMINI_KEY=your_gemini_api_key_here
OMDB_KEY=your_omdb_api_key_here
```

### 4. Build Tailwind CSS
To compile the Tailwind utility classes:

```bash
npm run build
```

### 5. Start the Development Server
Install the Vercel CLI globally (if you haven't already), and run the dev environment:

```bash
npm i -g vercel
vercel dev
```

The app will now be running on `http://localhost:3000` with both the frontend UI and the `/api/` endpoints fully functional!