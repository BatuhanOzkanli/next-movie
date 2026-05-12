console.log("Script loaded successfully!")
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyALScMi3gA2o1ZNrUyXI3_GoAEFC4gJuhw",
    authDomain: "moviewatchlist-175df.firebaseapp.com",
    projectId: "moviewatchlist-175df",
    storageBucket: "moviewatchlist-175df.firebasestorage.app",
    messagingSenderId: "243912543838",
    appId: "1:243912543838:web:775068875a24b698722ecf"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'movie-watchlist';

window.app = {
    omdbKey: 'f4bcfb9c', // The API Key
    watchlist: [],
    currentResults: [],
    user: null,
    userKey: null,
    unsubscribeSnapshot: null,
    searchMode: 'title',

    init: async function() {

        // Navigation & Header
        const logo = document.getElementById('nav-logo')
        if (logo) logo.addEventListener('click', () => this.resetToHome())

        const navSearch = document.getElementById('nav-search')
        if (navSearch) navSearch.addEventListener('click', () => this.switchView('search'))

        const navWatch = document.getElementById('nav-watchlist')
        if (navWatch) navWatch.addEventListener('click', () => this.switchView('watchlist'))
        
        const headerSync = document.getElementById('btn-header-sync')
        if (headerSync) headerSync.addEventListener('click', () => this.openKeyModal())
        
        // Mobile Menu
        const mobileMenuBtn = document.getElementById('btn-mobile-menu')
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu())

        const mobSearch = document.getElementById('mobile-nav-search')
        if (mobSearch) mobSearch.addEventListener('click', () => this.switchView('search'))
        
        const mobWatch = document.getElementById('mobile-nav-watchlist')
        if (mobWatch) mobWatch.addEventListener('click', () => this.switchView('watchlist'))
        
        const mobSync = document.getElementById('mobile-nav-sync')
        if (mobSync) mobSync.addEventListener('click', () => this.openKeyModal())

        // Search Functionality
        const searchBtn = document.getElementById('btn-search-action')
        if (searchBtn) searchBtn.addEventListener('click', () => this.handleSearch())
        
        const searchInput = document.getElementById('search-input')
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch()
            })
        searchInput.addEventListener('input', () => this.toggleClearButton())
        }

        const clearBtn = document.getElementById('btn-clear-search')
        if (clearBtn) clearBtn.addEventListener('click', () => this.ClearSearch())

        // Watchlist View Buttons
        const watchCopy = document.getElementById('btn-copy-key-watchlist')
        if (watchCopy) watchCopy.addEventListener('click', () => this.copyKey())

        const watchImport = document.getElementById('btn-open-import')
        if (watchImport) watchImport.addEventListener('click', () => this.openImportModal())

        const spinBtn = document.getElementById('btn-spin-wheel')
        if (spinBtn) spinBtn.addEventListener('click', () => this.pickRandomMovie())

        const aiBtn = document.getElementById('btn-ai-recommend')
        if (aiBtn) aiBtn.addEventListener('click', () => this.getAiRecommendation())

        const aiMobBtn = document.getElementById('btn-mobile-ai')
        if (aiMobBtn) aiMobBtn.addEventListener('click', () => this.getAiRecommendation())
        
        const closeAiRec = document.getElementById('btn-close-ai-rec')
        if (closeAiRec) closeAiRec.addEventListener('click', () => document.getElementById('ai-recommendation-area').classList.add('hidden'))

        const emptySearchBtn = document.getElementById('btn-empty-state-search')
        if (emptySearchBtn) emptySearchBtn.addEventListener('click', () => this.switchView('search'))


        // Modals
        //Sync Modal

        const closeKeyModal = document.getElementById('btn-close-key-modal')
        if (closeKeyModal) closeKeyModal.addEventListener('click', () => this.closeKeyModal())

        const copyKeyModal = document.getElementById('btn-copy-key-modal');
        if (copyKeyModal) copyKeyModal.addEventListener('click', () => this.copyKey())

        const loadKeyBtn = document.getElementById('btn-load-key')
        if (loadKeyBtn) loadKeyBtn.addEventListener('click', () => this.loadKey('input-sync-key'))

        // Import Modal

        const closeImpModal = document.getElementById('btn-close-import-modal')
        if (closeImpModal) closeImpModal.addEventListener('click', () => this.closeImportModal())

        const loadImpBtn = document.getElementById('btn-load-import-pure')
        if (loadImpBtn) loadImpBtn.addEventListener('click', () => this.loadKey('input-import-key-pure'))

        // Random Modal

        const closeRandModal = document.getElementById('btn-close-random-modal')
        if (closeRandModal) closeRandModal.addEventListener('click', () => document.getElementById('random-modal').classList.add('hidden'))

        const spinAgain = document.getElementById('btn-spin-again')
        if (spinAgain) spinAgain.addEventListener('click', () => this.pickRandomMovie())

        // AI Modal

        const closeAiModal = document.getElementById('btn-close-ai-modal')
        if (closeAiModal) closeAiModal.addEventListener('click', () => this.closeAiModal())

        const closeAiModalBtn = document.getElementById('btn-close-ai-modal-btn')
        if (closeAiModalBtn) closeAiModalBtn.addEventListener('click', () => this.closeAiModal())

        // Load or Generate Sync Key

        this.userKey = localStorage.getItem('fyf_user_key')
        if (!this.userKey) {
            this.userKey = 'user_' + Math.random().toString(36).substring(2, 9)
            localStorage.setItem('fyf_user_key', this.userKey)
        }
        this.updateKeyDisplay()

        this.updateNavState('search')

        // Auth
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user
                this.subscribeToWatchlist()
            }
        })

        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token)
            }
            else {
                await signInAnonymously(auth)
            }
        } catch (error) {
            console.error("Auth Failed:", error)
        }
    },

    resetToHome: function() {
        this.switchView('search')
        this.ClearSearch()
        if (this.SearchMode === 'mood') {
            const toggle = document.getElementById('search-mode-toggle')
            if (toggle) {
                toggle.checked = false
                this.toggleSearchMode()
            }
        }
        this.currentResults = []
        const grid = document.getElementById('search-grid')
        if (grid) grid.innerHTML = ''
        document.getElementById('search-placeholder').classList.remove('hidden')
        document.getElementById('search-loading').classList.add('hidden')
        document.getElementById('mobile-menu').classList.add('hidden')
    },

    clearSearch: function() {
        const input = document.getElementById('search-input')
        input.value = ''
        input.focus()
        this.toggleClearButton()
    },

    toggleClearSearch: function() {
        const input = document.getElementById('search-input')
        const btn = document.getElementById('btn-clear-search')
        if (input.value.trim().length > 0) {
            btn.classList.remove('hidden')
        } 
        else {
            btn.classList.add('hidden')
        }
    },

    // UI Toggles
    toggleSearchMode: function() {
        const checkbox = document.getElementById('search-mode-toggle')
        const labelTitle = document.getElementById('label-title')
        const labelMood = document.getElementById('label-mood')
        const icon = document.getElementById('search-icon');
        const input = document.getElementById('search-input')
        const bg = document.getElementById('search-container-bg');
        const hint = document.getElementById('mood-hint');
        const btn = document.getElementById('btn-search-action');

        if (checkbox.checked) {
            this.searchMode = 'mood'
            labelTitle.classList.remove('text-yellow-500');
            labelTitle.classList.add('text-gray-500');
            labelMood.classList.remove('text-gray-500');
            labelMood.classList.add('text-purple-400');
            icon.classList.remove('fa-search');
            icon.classList.add('fa-sparkles', 'text-purple-500');
            input.placeholder = 'Describe a mood (e.g. "Sad 90s sci-fi")...';
            bg.classList.add('border-purple-500/50', 'shadow-purple-900/20');
            bg.classList.remove('border-gray-800');
            hint.classList.remove('hidden');
            btn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600', 'text-black');
            btn.classList.add('bg-purple-600', 'hover:bg-purple-700', 'text-white');
            btn.innerText = "Ask AI";
        }
        else {
            this.searchMode = 'title'
            labelTitle.classList.add('text-yellow-500');
            labelTitle.classList.remove('text-gray-500');
            labelMood.classList.add('text-gray-500');
            labelMood.classList.remove('text-purple-400');
            icon.classList.add('fa-search');
            icon.classList.remove('fa-sparkles', 'text-purple-500');
            input.placeholder = 'Search for a movie (e.g. Blade Runner)...';
            bg.classList.remove('border-purple-500/50', 'shadow-purple-900/20');
            bg.classList.add('border-gray-800');
            hint.classList.add('hidden');
            btn.classList.add('bg-yellow-500', 'hover:bg-yellow-600', 'text-black');
            btn.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'text-white');
            btn.innerText = "Search";
        }
    },

    // Key Management
    updateKeyDisplay: function() {
        const elHeader = document.getElementById('header-key-display')
        const elModal = document.getElementById('modal-key-display')
        const elWatchlist = document.getElementById('watchlist-key-display')

        if (elHeader) elHeader.innerText = this.userKey
        if (elModal) elModal.innerText = this.userKey
        if (elWatchlist) elWatchlist.innerText = this.userKey
    },

    openKeyModal: function() {
        document.getElementById('key-modal').classList.remove('hidden')
    },

    closeKeyModal: function() {
        document.getElementById('key-modal').classList.add('hidden')
    },

    // New Import Modal Functions
    openImportModal: function() {
        document.getElementById('import-modal').classList.remove('hidden')
        setTimeout(() => document.getElementById('input-import-key-pure').focus(), 100)
    },

    closeImportModal: function() {
        document.getElementById('import-modal').classList.add('hidden')
    },

    copyKey: function() {
        navigator.clipboard.writeText(this.userKey)
        this.showToast("Key copied to clipboard!")
    },

    loadKey: function() {
        const idToUse = (typeof inputID === 'string') ? inputId : 'input-sync-key'
        const input = document.getElementById(idToUse)
        const newKey = input.value.trim()

        if (newKey && newKey.length > 5) {
            this.userKey = newKey
            localStorage.setItem('fyf_user_key', newKey)
            this.updateKeyDisplay()
            this.subscribeToWatchlist()
            this.closeKeyModal()
            this.closeImportModal()
            this.showToast("Sync Key loaded successfully!")
            input.value = ''
        }
        else {
            alert("Please enter a valid key.")
        }
    },

    handleSearch: function() {
        if (this.searchMode === 'mood') {
            this.searchByMood()
        }
        else {
            this.searchMovies()
        }
    },

    searchByMood: async function() {
        const input = document.getElementById('search-input')
        const mood = input.value.trim()

        if (!mood) return

        // Show loading UI
        document.getElementById('search-placeholder').classList.add('hidden')
        document.getElementById('search-grid').innerHTML = ''
        document.getElementById('search-loading').classList.remove('hidden')
        document.getElementById('search-loading-text').innerText = "AI is thinking..."

        try {
            // Prompt Engineering Step
            // Forcing Gemini to reply only with a JSON array.
            const prompt = `I am in the mood for: "${mood}". Recommend exactly 5 distinct movies that fit this mood perfectly. 
            Return only a raw JSON array of strings containing the movie titles. Example: ["The Matrix", "Inception", "Dune"]. 
            Do NOT include release years, markdown formatting, or any conversational text.`

            const aiResponseText = await this.callGemini(prompt)

            if (!aiResponseText) {
                throw new Error("AI returned nothing.")
            }

            // If Gemini wraps Json in markdown (```json ... ```). We have to strip that out just in case.
            const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim()

            // Turn the text into a real JavaScript Array
            const titles = JSON.parse(cleanJson)

            document.getElementById('search-loading-text').innerText = "Fetching posters..."

            // Ask OMDb for the posters of these 5 movies simultaneously
            const moviePromises = titles.map(title => 
                fetch(`https://www.omdbapi.com/?apikey=${this.omdbKey}&t=${encodeURIComponent(title)}`)
                .then(res => res.json())
            )

            // Wait for all 5 OMDb requests to finish
            const results = await Promise.all(moviePromises)

            // Keep only the ones OMDb actually found
            const validMovies = results.filter(m => m.Response === "True")

            // Render the results
            document.getElementById('search-loading').classList.add('hidden')

            if (validMovies.length > 0) {
                this.currentResults = validMovies
                this.renderSearchResults(validMovies)
            } 
            else {
                document.getElementById('search-grid').innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">AI suggested movies, but we couldn't find their posters.</div>`
            }
        } catch (error) {
            console.error("Mood Search Error:", error)
            document.getElementById('search-loading').classList.add('hidden')
            this.showToast("Oops! The AI got confused. Try a different mood.")
        }
    },

    searchMovies: async function() {
        const input = document.getElementById('search-input')
        const term = input.value.trim()

        if (!term) return

        // Show loading UI
        document.getElementById('search-placeholder').classList.add('hidden')
        document.getElementById('search-grid').innerHTML = ''
        document.getElementById('search-loading').classList.remove('hidden')

        try {
            // Fetching Data from OMDb
            const res = await fetch(`https://www.omdbapi.com/?apikey=${this.omdbKey}&s=${encodeURIComponent(term)}&type=movie`)
            const data = await res.json()

            // Hide Loading
            document.getElementById('search-loading').classList.add('hidden')

            // Handle Results
            if (data.Response === 'True') {
                this.currentResults = data.Search // Store the results in the memory.
                this.renderSearchResults(data.Search)
            }
            else {
                document.getElementById('search-grid').innerHTML =
                    `<div class="col-span-full text-center text-gray-500 py-10">No Movies found for "${term}".</div>`
            }
        }
        catch (error) {
            console.error(error)
            alert('Error connecting to server.')
        }
    },

    // --- Rendering ---
    renderSearchResults: function(movies) {
        const grid = document.getElementById('search-grid');
        grid.innerHTML = movies.map(movie => this.createMovieCard(movie, 'search')).join('');
    },

    renderWatchlist: function() {
        const grid = document.getElementById('watchlist-grid');
        const emptyState = document.getElementById('watchlist-empty');
        const countBadge = document.getElementById('watchlist-count');
        countBadge.innerText = `${this.watchlist.length}`;

        if (this.watchlist.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            grid.innerHTML = this.watchlist.map(movie => this.createMovieCard(movie, 'watchlist')).join('');
        }
    },

    createMovieCard: function(movie, context) {
        const isWatchlisted = this.watchlist.some(m => m.imdbID === movie.imdbID);
        const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : null;
        const safeTitle = movie.Title.replace(/'/g, "\\'"); 
        const isWatched = movie.isWatched || false;
        const rating = movie.rating || 0;
        const imdbScore = (movie.imdbRating && movie.imdbRating !== 'N/A') ? movie.imdbRating : null;
        
        // Check if this is a "Fill the Gap" movie
        const isAiPick = movie.isAiSuggestion === true;
        
        // If AI pick: Yellow border
        const borderClass = isAiPick ? 'border-yellow-500 border-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800';
        
        // --- THE FIX: Added 'title' and 'cursor-help' ---
        const badgeHtml = isAiPick ? `<div class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded z-20 shadow-md cursor-help" title="Similar movie to your search">RELATED</div>` : '';

        let bottomControlsHtml = '';
        let watchedSectionHtml = ''; 
        let metaGroupHtml = ''; 

        let scoreHtml = '';
        if (imdbScore) {
            scoreHtml = `
                <div class="flex items-center text-yellow-500 font-bold mr-2" title="IMDb Rating: ${imdbScore}">
                    <i class="fas fa-star text-[10px] mr-1"></i>
                    <span>${imdbScore}</span>
                </div>
            `;
        }

        const aiBtnHtml = `
            <button onclick="app.getVibeCheck('${safeTitle}', '${movie.Year}')" class="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 p-1.5 rounded-full transition-all" title="✨ AI Vibe Check">
                <i class="fas fa-magic text-sm"></i>
            </button>
        `;

        metaGroupHtml = `
            <div class="ml-auto flex items-center">
                ${scoreHtml}
                ${aiBtnHtml}
            </div>
        `;

        if (context === 'search') {
            if (isWatchlisted) {
                bottomControlsHtml = `
                    <button disabled class="w-full bg-gray-700 text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2">
                        <i class="fas fa-check"></i> Added
                    </button>
                `;
            } else {
                bottomControlsHtml = `
                    <button onclick="app.addToWatchlist('${movie.imdbID}')" class="w-full bg-gray-800 hover:bg-yellow-500 hover:text-black text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group">
                        <i class="fas fa-plus group-hover:scale-110 transition-transform"></i> Watchlist
                    </button>
                `;
            }
        } else {
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                const type = i <= rating ? 'fas' : 'far';
                const colorClass = i <= rating ? 'text-yellow-500' : 'text-gray-600';
                starsHtml += `<i class="${type} fa-star text-base ${colorClass}" onclick="app.setRating('${movie.imdbID}', ${i})"></i>`;
            }

            watchedSectionHtml = `
                <div class="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 mb-3 transition-colors group">
                    <div class="flex items-center justify-between relative z-10">
                        <label class="relative inline-flex items-center cursor-pointer group/toggle">
                            <input type="checkbox" ${isWatched ? 'checked' : ''} onchange="app.toggleWatched('${movie.imdbID}')" class="sr-only peer">
                            <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 transition-colors duration-300"></div>
                            <span class="ml-2 text-sm font-semibold transition-colors duration-300 text-gray-400 group-hover/toggle:text-gray-200 peer-checked:text-green-400">Watched</span>
                        </label>
                    </div>
                    <div class="grid transition-all duration-700 ease-in-out grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t border-transparent group-has-[:checked]:grid-rows-[1fr] group-has-[:checked]:opacity-100 group-has-[:checked]:mt-2 group-has-[:checked]:pt-2 group-has-[:checked]:border-gray-700/50">
                        <div class="overflow-hidden min-h-0">
                            <div class="star-rating flex justify-between px-1">
                                ${starsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            bottomControlsHtml = `
                <button onclick="app.removeFromWatchlist('${movie.imdbID}')" class="w-full text-xs text-red-400 hover:text-red-300 py-2 hover:bg-red-900/20 rounded transition-colors text-center border border-transparent hover:border-red-900/30">
                    Remove from List
                </button>
            `;
        }

        return `
            <div class="movie-card bg-[#1A1A1A] rounded-xl overflow-hidden shadow-lg border ${borderClass} flex flex-col h-full relative group/card ${isWatched && context === 'watchlist' ? 'opacity-80 grayscale-[0.3] hover:opacity-100 hover:grayscale-0' : ''}">
                
                ${badgeHtml}

                <div class="relative aspect-[2/3] w-full bg-gray-800 overflow-hidden poster-container">
                    ${posterUrl 
                        ? `<img src="${posterUrl}" alt="${movie.Title}" class="w-full h-full object-cover">` 
                        : `<div class="w-full h-full placeholder-poster"><i class="fas fa-film text-4xl"></i></div>`
                    }
                    <div class="poster-overlay absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span class="bg-black/80 text-white px-3 py-1 rounded text-sm backdrop-blur-sm border border-gray-700">
                            ${movie.Year}
                        </span>
                    </div>
                </div>
                
                <div class="p-4 flex flex-col flex-grow">
                    <div>
                        <h3 class="text-white font-bold text-lg leading-tight mb-2 line-clamp-2 h-12 overflow-hidden" title="${movie.Title}">
                            ${movie.Title}
                        </h3>
                        
                        <div class="flex items-center text-xs text-gray-400 mb-4 uppercase tracking-wide">
                            <span>${movie.Type}</span>
                            <span class="mx-2">•</span>
                            <span>${movie.Year}</span>
                            ${metaGroupHtml}
                        </div>

                        ${watchedSectionHtml}
                    </div>
                    
                    <div class="mt-auto">
                        ${bottomControlsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    addToWatchlist: function(imdbID) {
        if (!this.user) {
            this.showToast("Initializing cloud sync...");
            return;
        }
        const movie = this.currentResults.find(m => m.imdbID === imdbID);
        if (movie && !this.watchlist.some(m => m.imdbID === imdbID)) {
            movie.isWatched = false;
            movie.rating = 0;
            this.watchlist.push(movie);
            this.saveWatchlistToCloud();
            this.renderSearchResults(this.currentResults);
            this.showToast(`Added "${movie.Title}" to watchlist`);
        }
    },

    removeFromWatchlist: function(imdbID) {
        if (!this.user) return;
        this.watchlist = this.watchlist.filter(m => m.imdbID !== imdbID);
        this.saveWatchlistToCloud();
        this.renderWatchlist();
        this.showToast('Movie removed from watchlist');
    },

    // --- Feature 1: Watched & Rating ---
    toggleWatched: function(imdbID) {
        const movie = this.watchlist.find(m => m.imdbID === imdbID);
        if (!movie) return;

        // 1. Tell the app we are animating locally
        this.isToggling = true;

        // 2. Update Data
        movie.isWatched = !movie.isWatched;
        
        // 3. Save to Cloud
        this.saveWatchlistToCloud();
        
        // 4. Reset flag after animation finishes (700ms)
        setTimeout(() => {
            this.isToggling = false;
        }, 750);
    },

    setRating: function(imdbID, rating) {
        const movie = this.watchlist.find(m => m.imdbID === imdbID);
        if (movie) {
            movie.rating = rating;
            this.saveWatchlistToCloud();
            this.renderWatchlist();
        }
    },

    pickRandomMovie: function() {
        // Only pick from movies you havent watched yet
        const unwatched = this.watchlist.filter(m => !m.isWatched)
        const pool = unwatched.length > 0 ? unwatched : this.watchlist

        if (pool.length === 0) {
            this.showToast("Add some movies first")
            return
        }

        // The match to pick a random item from an array
        const randomMovie = pool[Math.floor(Math.random() * pool.length)]

        const modal = document.getElementById('random-modal')
        const container = document.getElementById('random-movie-container')

        modal.classList.remove('hidden')

        container.innerHTML = `
        <div class="inline-block relative rounded-lg overflow-hidden shadow-2xl border-4 border-white mb-4 transform scale-100 hover:scale-105 transition-transform">
            ${randomMovie.Poster !== 'N/A'
                ? `<img src="${randomMovie.Poster}" class="h-64 object-cover">`
                : `<div class="h-64 w-44 bg-gray-800 flex items-center justify-center"><i class="fas fa-film text-4xl text-gray-600"></i></div>`
            }
        </div>
        <h2 class="text-3xl font-bold text-white mb-1">${randomMovie.Title}</h2>
        <p class="text-pink-300 font-mono text-sm">${randomMovie.Year}</p>
        `
    },
    
    // Talk to Vercel Backend
    callGemini: async function(prompt) {
        try {
            // Calling api folder, not Google directly
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            })

            const data = await response.json()

            console.log("🕵️ RAW AI RESPONSE:", data)

            // Grab just the text in Google's response structure
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text
            }
            else {
                return null
            }
        } catch (error) {
            console.error("AI Error:", error)
            return null
        }
    },

    // Firestore Sync
    subscribeToWatchlist: function() {
        if (!this.user || !this.userKey) return;
        if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();

        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'custom_watchlists', this.userKey);
        
        this.unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            // Respect the local toggle flag
            if (this.isToggling && docSnap.metadata.hasPendingWrites) {
                return;
            }

            if (docSnap.exists()) {
                const data = docSnap.data();
                this.watchlist = data.movies || [];
                
                // Trigger the auto-fix
                this.backfillMissingRatings(); 
            } else {
                this.watchlist = [];
            }
            this.renderWatchlist();
            if (this.currentResults.length > 0) this.renderSearchResults(this.currentResults);
        }, (error) => {
            console.error("Sync Error:", error);
        });
    },

    saveWatchlistToCloud: async function() {
        if (!this.user || !this.userKey) return;
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'custom_watchlists', this.userKey);
        try {
            await setDoc(docRef, { movies: this.watchlist, lastUpdated: new Date().toISOString() });
        } catch (e) {
            console.error("Save Error:", e);
            this.showToast("Error saving to cloud");
        }
    },
    
    // Auto-Fix Old Data
    backfillMissingRatings: async function() {
        // Find movies that don't have a rating yet
        const missing = this.watchlist.filter(m => m.imdbRating === undefined);
        
        if (missing.length === 0) return; // Nothing to fix

        console.log(`Backfilling ratings for ${missing.length} movies...`);

        // 2. Fetch details for all of them
        const promises = missing.map(async (movie) => {
            try {
                const res = await fetch(`https://www.omdbapi.com/?apikey=${this.omdbKey}&i=${movie.imdbID}`);
                const data = await res.json();
                if (data.Response === 'True') {
                    // If API has a rating, use it. If not, mark as "N/A" so we don't try again.
                    movie.imdbRating = data.imdbRating || "N/A";
                }
            } catch (e) {
                console.error('Backfill failed for', movie.Title);
            }
        });

        // Wait for all fetches to finish
        await Promise.all(promises);
        
        // Save the fixed data back to the Cloud
        this.saveWatchlistToCloud();
        this.renderWatchlist();
    },

    showToast: function(message) {
        const toast = document.getElementById('toast')
        document.getElementById('toast-message').innerText = message

        // Slide in and fade up
        toast.classList.remove('translate-y-20', 'opacity-0')

        // Wait 3 seconds, then slide out
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0')
        }, 3000)
    }

}

// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener("DOMContentLoaded", () => {
    window.app.init()
})

