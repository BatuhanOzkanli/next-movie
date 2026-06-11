import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'

const firebaseConfig = {
    apiKey: "AIzaSyALScMi3gA2o1ZNrUyXI3_GoAEFC4gJuhw",
    authDomain: "moviewatchlist-175df.firebaseapp.com",
    projectId: "moviewatchlist-175df",
    storageBucket: "moviewatchlist-175df.firebasestorage.app",
    messagingSenderId: "243912543838",
    appId: "1:243912543838:web:775068875a24b698722ecf"
}

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'movie-watchlist'

window.app = {
    watchlist: [],
    currentResults: [],
    user: null,
    userKey: null,
    unsubscribeSnapshot: null,
    searchMode: 'title', // 'title' or 'mood'
    
    init: async function() {
        // Map UI interactions
        document.getElementById('nav-logo')?.addEventListener('click', () => this.resetToHome())
        document.getElementById('nav-search')?.addEventListener('click', () => this.switchView('search'))
        document.getElementById('nav-watchlist')?.addEventListener('click', () => this.switchView('watchlist'))
        document.getElementById('btn-header-sync')?.addEventListener('click', () => this.openKeyModal())

        document.getElementById('btn-mobile-menu')?.addEventListener('click', () => this.toggleMobileMenu())
        document.getElementById('mobile-nav-search')?.addEventListener('click', () => this.switchView('search'))
        document.getElementById('mobile-nav-watchlist')?.addEventListener('click', () => this.switchView('watchlist'))
        document.getElementById('mobile-nav-sync')?.addEventListener('click', () => this.openKeyModal())

        document.getElementById('btn-search-action')?.addEventListener('click', () => this.handleSearch())
        const searchInput = document.getElementById('search-input')
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch()
            })
            searchInput.addEventListener('input', () => this.toggleClearButton())
        }
        document.getElementById('btn-clear-search')?.addEventListener('click', () => this.clearSearch())

        document.getElementById('btn-copy-key-watchlist')?.addEventListener('click', () => this.copyKey())
        document.getElementById('btn-open-import')?.addEventListener('click', () => this.openImportModal())
        document.getElementById('btn-spin-wheel')?.addEventListener('click', () => this.pickRandomMovie())
        document.getElementById('btn-ai-recommend')?.addEventListener('click', () => this.getAiRecommendation())
        document.getElementById('btn-mobile-ai')?.addEventListener('click', () => this.getAiRecommendation())
        document.getElementById('btn-close-ai-rec')?.addEventListener('click', () => document.getElementById('ai-recommendation-area').classList.add('hidden'))
        document.getElementById('btn-empty-state-search')?.addEventListener('click', () => this.switchView('search'))

        document.getElementById('btn-close-key-modal')?.addEventListener('click', () => this.closeKeyModal())
        document.getElementById('btn-copy-key-modal')?.addEventListener('click', () => this.copyKey())
        document.getElementById('btn-load-key')?.addEventListener('click', () => this.loadKey('input-sync-key'))
        document.getElementById('btn-close-import-modal')?.addEventListener('click', () => this.closeImportModal())
        document.getElementById('btn-load-import-pure')?.addEventListener('click', () => this.loadKey('input-import-key-pure'))
        document.getElementById('btn-close-random-modal')?.addEventListener('click', () => document.getElementById('random-modal').classList.add('hidden'))
        document.getElementById('btn-spin-again')?.addEventListener('click', () => this.pickRandomMovie())
        document.getElementById('btn-close-ai-modal')?.addEventListener('click', () => this.closeAiModal())
        document.getElementById('btn-close-ai-modal-btn')?.addEventListener('click', () => this.closeAiModal())

        // Hydrate session key or generate a new one
        this.userKey = localStorage.getItem('fyf_user_key')
        if (!this.userKey) {
            this.userKey = 'user_' + Math.random().toString(36).substring(2, 9)
            localStorage.setItem('fyf_user_key', this.userKey)
        }
        this.updateKeyDisplay()
        this.updateNavState('search')
        
        // Boot up Firestore sync once auth resolves
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user
                this.subscribeToWatchlist()
            }
        })

        // Require anonymous auth to satisfy Firebase security rules
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token)
            } else {
                await signInAnonymously(auth)
            }
        } catch (error) {
            console.error("Auth Failed:", error)
        }
    },

    resetToHome: function() {
        this.switchView('search')
        this.clearSearch()
        
        // Reset toggle if returning from Mood mode
        if (this.searchMode === 'mood') {
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

    toggleClearButton: function() {
        const input = document.getElementById('search-input')
        const btn = document.getElementById('btn-clear-search')
        if (input.value.trim().length > 0) {
            btn.classList.remove('hidden')
        } else {
            btn.classList.add('hidden')
        }
    },

    toggleSearchMode: function() {
        const checkbox = document.getElementById('search-mode-toggle')
        const labelTitle = document.getElementById('label-title')
        const labelMood = document.getElementById('label-mood')
        const icon = document.getElementById('search-icon')
        const input = document.getElementById('search-input')
        const bg = document.getElementById('search-container-bg')
        const hint = document.getElementById('mood-hint')
        const btn = document.getElementById('btn-search-action')

        if (checkbox.checked) {
            this.searchMode = 'mood'
            labelTitle.classList.remove('text-yellow-500')
            labelTitle.classList.add('text-gray-500')
            labelMood.classList.remove('text-gray-500')
            labelMood.classList.add('text-purple-400')
            icon.classList.remove('fa-search')
            icon.classList.add('fa-sparkles', 'text-purple-500')
            input.placeholder = 'Describe a mood (e.g. "Sad 90s sci-fi")...'
            bg.classList.add('border-purple-500/50', 'shadow-purple-900/20')
            bg.classList.remove('border-gray-800')
            hint.classList.remove('hidden')
            btn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600', 'text-black')
            btn.classList.add('bg-purple-600', 'hover:bg-purple-700', 'text-white')
            btn.innerText = "Ask AI"
        } else {
            this.searchMode = 'title'
            labelTitle.classList.add('text-yellow-500')
            labelTitle.classList.remove('text-gray-500')
            labelMood.classList.add('text-gray-500')
            labelMood.classList.remove('text-purple-400')
            icon.classList.add('fa-search')
            icon.classList.remove('fa-sparkles', 'text-purple-500')
            input.placeholder = 'Search for a movie (e.g. Blade Runner)...'
            bg.classList.remove('border-purple-500/50', 'shadow-purple-900/20')
            bg.classList.add('border-gray-800')
            hint.classList.add('hidden')
            btn.classList.add('bg-yellow-500', 'hover:bg-yellow-600', 'text-black')
            btn.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'text-white')
            btn.innerText = "Search"
        }
    },

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

    loadKey: function(inputId) {
        const idToUse = (typeof inputId === 'string') ? inputId : 'input-sync-key'
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
        } else {
            alert("Please enter a valid key.")
        }
    },

    subscribeToWatchlist: function() {
        if (!this.user || !this.userKey) return
        
        if (this.unsubscribeSnapshot) this.unsubscribeSnapshot()

        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'custom_watchlists', this.userKey)
        
        this.unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            // Ignore Firestore updates if we're running a local UI animation to prevent state thrashing
            if (this.isToggling && docSnap.metadata.hasPendingWrites) {
                return
            }

            if (docSnap.exists()) {
                const data = docSnap.data()
                this.watchlist = data.movies || []
                this.backfillMissingRatings() 
            } else {
                this.watchlist = []
            }
            this.renderWatchlist()
            if (this.currentResults.length > 0) this.renderSearchResults(this.currentResults)
        }, (error) => {
            console.error("Sync Error:", error)
        })
    },

    saveWatchlistToCloud: async function() {
        if (!this.user || !this.userKey) return
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'custom_watchlists', this.userKey)
        try {
            await setDoc(docRef, { movies: this.watchlist, lastUpdated: new Date().toISOString() })
        } catch (e) {
            console.error("Save Error:", e)
            this.showToast("Error saving to cloud")
        }
    },
    
    backfillMissingRatings: async function() {
        // Patch older watchlist entries that don't have IMDb ratings yet
        const missing = this.watchlist.filter(m => m.imdbRating === undefined)
        if (missing.length === 0) return

        const promises = missing.map(async (movie) => {
            try {
                // Route through secure backend to hide API key
                const res = await fetch(`/api/omdb?i=${movie.imdbID}`)
                const data = await res.json()
                if (data.Response === 'True') {
                    movie.imdbRating = data.imdbRating || "N/A"
                }
            } catch (e) {
                console.error('Backfill failed for', movie.Title)
            }
        })

        await Promise.all(promises)
        this.saveWatchlistToCloud()
        this.renderWatchlist()
    },

    toggleWatched: function(imdbID) {
        const movie = this.watchlist.find(m => m.imdbID === imdbID)
        if (!movie) return

        // Lock the UI briefly to prevent jank during the network round-trip
        this.isToggling = true
        movie.isWatched = !movie.isWatched
        this.saveWatchlistToCloud()
        
        setTimeout(() => {
            this.isToggling = false
        }, 750)
    },

    setRating: function(imdbID, rating) {
        const movie = this.watchlist.find(m => m.imdbID === imdbID)
        if (movie) {
            movie.rating = rating
            this.saveWatchlistToCloud()
            this.renderWatchlist()
        }
    },

    updateStarUI: function(imdbID, targetRating) {
        for (let i = 1; i <= 5; i++) {
            const star = document.getElementById(`star-${imdbID}-${i}`)
            if (star) {
                if (i <= targetRating) {
                    star.classList.remove('far', 'text-gray-600')
                    star.classList.add('fas', 'text-yellow-500', 'scale-110')
                } else {
                    star.classList.remove('fas', 'text-yellow-500', 'scale-110')
                    star.classList.add('far', 'text-gray-600')
                }
            }
        }
    },

    pickRandomMovie: function() {
        const unwatched = this.watchlist.filter(m => !m.isWatched)
        const pool = unwatched.length > 0 ? unwatched : this.watchlist

        if (pool.length === 0) {
            this.showToast("Add some movies first!")
            return
        }

        const modal = document.getElementById('random-modal')
        const container = document.getElementById('random-movie-container')
        const spinBtn = document.getElementById('btn-spin-again')

        if (spinBtn) spinBtn.disabled = true

        modal.classList.remove('hidden')

        // 1. Determine the new winner
        const winningMovie = pool[Math.floor(Math.random() * pool.length)]

        // 2. Build the track array with SMART DUPLICATE PREVENTION
        const trackItems = []
        const startIndex = 2 
        const winningIndex = 25 
        
        for (let i = 0; i < 30; i++) {
            if (this.lastTrackItems && i <= 6) {
                trackItems.push(this.lastTrackItems[23 + i])
            } else if (i === winningIndex) {
                trackItems.push(winningMovie)
            } else {
                let randomMovie = pool[Math.floor(Math.random() * pool.length)]
                
                // Prevent identical movies from sitting side-by-side
                if (pool.length > 1 && i > 0) {
                    let attempts = 0
                    while (
                        (randomMovie.imdbID === trackItems[i - 1].imdbID || 
                        (i === winningIndex - 1 && randomMovie.imdbID === winningMovie.imdbID)) 
                        && attempts < 15
                    ) {
                        randomMovie = pool[Math.floor(Math.random() * pool.length)]
                        attempts++ 
                    }
                }
                trackItems.push(randomMovie)
            }
        }

        this.lastTrackItems = trackItems

        // INCREASED GAP: Changed from gap-4 to gap-6 for breathing room
        let trackHtml = `<div id="roulette-track" class="flex items-center gap-4" style="transform: translateX(0px) width: max-content">`

        trackItems.forEach((m, idx) => {
            const posterUrl = (m.Poster && m.Poster !== 'N/A') ? m.Poster : null
            trackHtml += `
                <div class="roulette-card flex-shrink-0 transition-all duration-500 opacity-40" id="card-${idx}" style="width: 144px height: 224px min-width: 144px min-height: 224px">
                    <div class="relative rounded-xl overflow-hidden shadow-xl border-4 border-gray-800 bg-gray-900 w-full h-full block">
                        ${posterUrl 
                            ? `<img src="${posterUrl}" class="absolute inset-0 w-full h-full object-cover">` 
                            : `<div class="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800"><i class="fas fa-film text-3xl text-gray-600"></i></div>`
                        }
                    </div>
                </div>
            `
        })
        trackHtml += `</div>`

        const imdbScore = (winningMovie.imdbRating && winningMovie.imdbRating !== 'N/A') ? winningMovie.imdbRating : null
        let scoreHtml = ''
        if (imdbScore) {
            scoreHtml = `
                <div class="flex items-center justify-center text-yellow-500 font-bold mt-2" title="IMDb Rating: ${imdbScore}">
                    <i class="fas fa-star text-sm" style="margin-right: 8px position: relative top: -1px"></i>
                    <span class="text-lg">${imdbScore}</span>
                </div>
            `
        }

        // TIGHTER CONTAINER: Tighter fade mask (80px) to look better on the smaller max-w-lg modal
        container.innerHTML = `
            <div class="relative w-full overflow-hidden py-4" style="-webkit-mask-image: linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent) mask-image: linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)">
                <div class="absolute top-0 bottom-0 left-1/2 w-1.5 bg-yellow-500 z-10 transform -translate-x-1/2 shadow-[0_0_15px_rgba(234,179,8,0.8)] rounded-full"></div>
                ${trackHtml}
            </div>
            
            <div id="winner-info" class="mt-4 opacity-0 transition-opacity duration-1000 h-24 text-center flex flex-col items-center">
                <h2 class="text-2xl font-bold text-white mb-1">${winningMovie.Title}</h2>
                <p class="text-pink-300 font-mono text-sm">${winningMovie.Year}</p>
                ${scoreHtml}
            </div>
        `

        const track = document.getElementById('roulette-track')
        const startCard = document.getElementById(`card-${startIndex}`)
        const winnerCard = document.getElementById(`card-${winningIndex}`)
        
        const containerCenter = container.offsetWidth / 2
        const startCenter = startCard.offsetLeft + (startCard.offsetWidth / 2)
        const initialDistance = containerCenter - startCenter

        track.style.transform = `translateX(${initialDistance}px)`

        // Highlight previous winner (No scaling)
        startCard.classList.remove('opacity-40')
        startCard.classList.add('opacity-100')
        startCard.querySelector('.border-4').classList.replace('border-gray-800', 'border-yellow-500')

        void track.offsetWidth 

        setTimeout(() => {
            // Un-highlight previous winner
            startCard.classList.add('opacity-40')
            startCard.classList.remove('opacity-100')
            startCard.querySelector('.border-4').classList.replace('border-yellow-500', 'border-gray-800')

            track.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.3, 1)'
            
            const winnerCenter = winnerCard.offsetLeft + (winnerCard.offsetWidth / 2)
            const finalDistance = containerCenter - winnerCenter
            track.style.transform = `translateX(${finalDistance}px)`

            setTimeout(() => {
                // Highlight new winner (No scaling, just opacity and glowing border)
                winnerCard.classList.remove('opacity-40')
                winnerCard.classList.add('opacity-100', 'z-20')
                winnerCard.querySelector('.border-4').classList.replace('border-gray-800', 'border-yellow-500')
                winnerCard.querySelector('.border-4').classList.add('shadow-[0_0_30px_rgba(234,179,8,0.4)]')

                document.getElementById('winner-info').classList.remove('opacity-0')
                if (spinBtn) spinBtn.disabled = false
            }, 4000)

        }, 150) 
    },

    switchView: function(viewName) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'))
        document.getElementById(`view-${viewName}`).classList.remove('hidden')
        this.updateNavState(viewName)
        if (viewName === 'watchlist') this.renderWatchlist()
        document.getElementById('mobile-menu').classList.add('hidden')
    },

    updateNavState: function(activeView) {
        const navSearch = document.getElementById('nav-search')
        const navWatch = document.getElementById('nav-watchlist')
        
        if (activeView === 'search') {
            navSearch.classList.add('text-white')
            navSearch.classList.remove('text-gray-400')
            navWatch.classList.add('text-gray-400')
            navWatch.classList.remove('text-white')
        } else {
            navWatch.classList.add('text-white')
            navWatch.classList.remove('text-gray-400')
            navSearch.classList.add('text-gray-400')
            navSearch.classList.remove('text-white')
        }
    },

    toggleMobileMenu: function() {
        document.getElementById('mobile-menu').classList.toggle('hidden')
    },

    handleSearch: function() {
        if (this.searchMode === 'mood') {
            this.searchByMood()
        } else {
            this.searchMovies()
        }
    },

    searchMovies: async function(overrideTerm = null) {
        const searchInput = document.getElementById('search-input')
        const term = overrideTerm || searchInput.value.trim()
        
        if (!term) return

        document.getElementById('search-placeholder').classList.add('hidden')
        document.getElementById('search-grid').innerHTML = ''
        document.getElementById('search-loading').classList.remove('hidden')
        
        if (overrideTerm) {
            document.getElementById('search-loading-text').innerText = `Typo detected! Searching for "${overrideTerm}"...`
        } else {
            document.getElementById('search-loading-text').innerText = "Searching database..."
        }

        try {
            // Fetch two pages concurrently for a better filtering pool
            const p1Promise = fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: term })
            }).then(r => r.json())

            const p2Promise = fetch(`/api/omdb?s=${encodeURIComponent(term)}&type=movie&page=2`)
                .then(r => r.json())

            const [data1, data2] = await Promise.all([p1Promise, p2Promise])

            let candidates = []
            if (data1.Response === "True") candidates = [...candidates, ...data1.Search]
            if (data2.Response === "True") candidates = [...candidates, ...data2.Search]

            const uniqueCandidates = Array.from(new Map(candidates.map(m => [m.imdbID, m])).values())

            // Fallback to AI typo correction if OMDb returns nothing
            if (uniqueCandidates.length === 0) {
                 if (!overrideTerm) {
                    document.getElementById('search-loading-text').innerText = "Checking for typos..."
                    const prompt = `The user searched for movie title "${term}" but found no results. It likely contains a typo. Return ONLY a raw JSON array with a single string containing the corrected movie title. Example: ["The Matrix"]. If you are unsure, return [].`
                    const jsonStr = await this.callGemini(prompt)
                    if (jsonStr) {
                        try {
                            const suggestions = JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim())
                            if (Array.isArray(suggestions) && suggestions.length > 0 && suggestions[0].toLowerCase() !== term.toLowerCase()) {
                                await this.searchMovies(suggestions[0])
                                return 
                            }
                        } catch (e) { console.error(e) }
                    }
                }
                document.getElementById('search-loading').classList.add('hidden')
                document.getElementById('search-grid').innerHTML = `<div class="col-span-full text-center text-gray-500 py-10"><p class="text-xl">No movies found for "${term}".</p></div>`
                return
            }

            document.getElementById('search-loading-text').innerText = `Analyzing ${uniqueCandidates.length} candidates...`
            
            const detailPromises = uniqueCandidates.map(movie => 
                fetch(`/api/omdb?i=${movie.imdbID}`)
                    .then(res => res.json())
                    .catch(() => movie)
            )
            const allDetailedMovies = await Promise.all(detailPromises)

            // Filter out non-movies, documentaries, and behind-the-scenes content
            const cleanMovies = allDetailedMovies.filter(m => {
                const genre = (m.Genre || "").toLowerCase()
                const title = (m.Title || "").toLowerCase()
                const type = (m.Type || "").toLowerCase()
                if (type !== 'movie') return false
                if (genre.includes('documentary') || genre.includes('short') || genre.includes('news')) return false
                if (title.includes('making of') || title.includes('behind the scenes')) return false
                return true
            })

            let finalResults = cleanMovies.slice(0, 10)
            
            // If the grid isn't full, ask Gemini to recommend related movies to fill it out
            if (finalResults.length > 0 && finalResults.length < 10) {
                const needed = 10 - finalResults.length
                document.getElementById('search-loading-text').innerText = `Found ${finalResults.length} matches. Finding ${needed} related movies to fill the grid...`
                
                const existingTitles = finalResults.map(m => m.Title).join(", ")
                const prompt = `I am building a search grid for the term "${term}". I found these valid movies: [${existingTitles}]. I need exactly ${needed} more DISTINCT, high-quality movie recommendations that are similar in genre/vibe to "${term}" to fill the grid. Return ONLY a raw JSON array of strings. Do not repeat existing titles.`
                
                const jsonStr = await this.callGemini(prompt)
                
                if (jsonStr) {
                    try {
                        const relatedTitles = JSON.parse(jsonStr.replace(/```json/g, '').replace(/```/g, '').trim())
                        if (Array.isArray(relatedTitles)) {
                            const relatedPromises = relatedTitles.map(title => 
                                fetch(`/api/omdb?t=${encodeURIComponent(title)}`)
                                    .then(res => res.json())
                            )
                            
                            const relatedMovies = await Promise.all(relatedPromises)
                            const validRelated = relatedMovies.filter(m => m.Response === "True" && m.Type === 'movie')
                            
                            // Tag AI suggestions so the UI can highlight them
                            validRelated.forEach(m => m.isAiSuggestion = true)
                            
                            finalResults = [...finalResults, ...validRelated]
                            finalResults = finalResults.slice(0, 10)
                        }
                    } catch (e) {
                        console.error("AI Fill failed", e)
                    }
                }
            }

            document.getElementById('search-loading').classList.add('hidden')
            
            if (finalResults.length === 0) {
                document.getElementById('search-grid').innerHTML = `<div class="col-span-full text-center py-10">No movies found.</div>`
            } else {
                this.currentResults = finalResults
                this.renderSearchResults(finalResults)
                if (overrideTerm) {
                    searchInput.value = overrideTerm
                    this.showToast(`Auto-corrected to "${overrideTerm}"`)
                }
            }

        } catch (error) {
            console.error(error)
            document.getElementById('search-loading').classList.add('hidden')
            alert('Error connecting to server.')
        }
    },


    searchByMood: async function() {
        const searchInput = document.getElementById('search-input')
        const mood = searchInput.value.trim()
        
        if (!mood) return

        document.getElementById('search-placeholder').classList.add('hidden')
        document.getElementById('search-grid').innerHTML = ''
        document.getElementById('search-loading').classList.remove('hidden')
        document.getElementById('search-loading-text').innerText = "AI is finding movies matching your mood..."

        const prompt = `I am in the mood for: "${mood}". Recommend 10 distinct movies that fit this mood perfectly. Return ONLY a raw JSON array of strings with the movie titles. Example: ["Movie A", "Movie B"]. Do not include years or markdown.`
        
        const jsonStr = await this.callGemini(prompt)
        
        if (!jsonStr) {
            document.getElementById('search-loading').classList.add('hidden')
            alert("AI could not understand the mood. Try again.")
            return
        }

        try {
            const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim()
            const titles = JSON.parse(cleanJson)

            if (!Array.isArray(titles) || titles.length === 0) throw new Error("Invalid format")

            document.getElementById('search-loading-text').innerText = `Found ${titles.length} matches. Fetching details...`
            
            const moviePromises = titles.map(title => 
                fetch(`/api/omdb?t=${encodeURIComponent(title)}`)
                    .then(res => res.json())
            )

            const results = await Promise.all(moviePromises)
            const validMovies = results.filter(m => m.Response === "True")

            document.getElementById('search-loading').classList.add('hidden')
            
            if (validMovies.length > 0) {
                this.currentResults = validMovies
                this.renderSearchResults(validMovies)
            } else {
                document.getElementById('search-grid').innerHTML = `
                    <div class="col-span-full text-center text-gray-500 py-10">
                        <p class="text-xl">AI found titles, but OMDb couldn't load them.</p>
                    </div>
                `
            }

        } catch (e) {
            console.error("Mood Search Error", e)
            document.getElementById('search-loading').classList.add('hidden')
            alert("Something went wrong with the mood search.")
        }
    },

    callGemini: async function(prompt) {
        try {
            // Route through Vercel proxy so the key isn't exposed to the client
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            })

            if (!response.ok) {
                console.error("Backend Error:", response.status)
                return null
            }

            const data = await response.json()

            if (data.text) {
                return data.text
            } else {
                return null
            }
        } catch (error) {
            console.error("AI Error:", error)
            return null
        }
    },

    getVibeCheck: async function(title, year) {
        const modal = document.getElementById('ai-modal')
        const loading = document.getElementById('ai-modal-loading')
        const content = document.getElementById('ai-modal-content')
        document.getElementById('ai-modal-title').innerText = `${title} (${year})`
        document.getElementById('ai-modal-text').innerText = ''
        modal.classList.remove('hidden')
        loading.classList.remove('hidden')
        content.classList.add('hidden')

        const prompt = `Give me a short, 2-sentence "vibe check" summary of the movie "${title}" (${year}). Focus on the atmosphere and style. Do not include spoilers. Be fun and casual. Use 1 emoji.`
        const result = await this.callGemini(prompt)
        
        loading.classList.add('hidden')
        content.classList.remove('hidden')
        if (result) document.getElementById('ai-modal-text').innerText = result
        else document.getElementById('ai-modal-text').innerText = "Oops! The AI is taking a popcorn break. Try again later."
    },

    getAiRecommendation: async function() {
        if (this.watchlist.length === 0) {
            this.showToast("Add movies to your watchlist first!")
            return
        }
        const area = document.getElementById('ai-recommendation-area')
        const loading = document.getElementById('ai-rec-loading')
        const content = document.getElementById('ai-rec-content')
        const textEl = document.getElementById('ai-rec-text')
        area.classList.remove('hidden')
        loading.classList.remove('hidden')
        content.classList.add('hidden')
        textEl.innerText = ""

        // Send current watchlist state to prevent duplicate recommendations
        const movieTitles = this.watchlist.map(m => `${m.Title} (${m.Year})`).join(', ')
        const prompt = `Based on this list of movies I like: [${movieTitles}], recommend ONE movie I should watch next that is NOT in this list. Provide the title, year, and a 1-sentence reason why I'd like it based on my list. Format: "Movie Title (Year) - Reason". Random seed: ${Math.random()}`
        const result = await this.callGemini(prompt)

        loading.classList.add('hidden')
        content.classList.remove('hidden')
        if (result) textEl.innerText = result
        else textEl.innerText = "Could not generate a recommendation right now."
    },

    closeAiModal: function() {
        document.getElementById('ai-modal').classList.add('hidden')
    },

    renderSearchResults: function(movies) {
        const grid = document.getElementById('search-grid')
        grid.innerHTML = movies.map(movie => this.createMovieCard(movie, 'search')).join('')
    },

    renderWatchlist: function() {
        const grid = document.getElementById('watchlist-grid')
        const emptyState = document.getElementById('watchlist-empty')
        const countBadge = document.getElementById('watchlist-count')
        countBadge.innerText = `${this.watchlist.length}`

        if (this.watchlist.length === 0) {
            grid.innerHTML = ''
            emptyState.classList.remove('hidden')
        } else {
            emptyState.classList.add('hidden')
            grid.innerHTML = this.watchlist.map(movie => this.createMovieCard(movie, 'watchlist')).join('')
        }
    },

    createMovieCard: function(movie, context) {
        const isWatchlisted = this.watchlist.some(m => m.imdbID === movie.imdbID)
        const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : null
        const safeTitle = movie.Title.replace(/'/g, "\\'") 
        const isWatched = movie.isWatched || false
        const rating = movie.rating || 0
        const imdbScore = (movie.imdbRating && movie.imdbRating !== 'N/A') ? movie.imdbRating : null
        
        const isAiPick = movie.isAiSuggestion === true
        const borderClass = isAiPick ? 'border-yellow-500 border-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800'
        const badgeHtml = isAiPick ? `<div class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded z-20 shadow-md cursor-help" title="Similar movie to your search">RELATED</div>` : ''

        let bottomControlsHtml = ''
        let watchedSectionHtml = '' 
        let metaGroupHtml = '' 

        // Inline styling used here to bypass Tailwind's compiler for sub-pixel icon alignment
        let scoreHtml = ''
        if (imdbScore) {
            scoreHtml = `
            <div class="flex items-center text-yellow-500 font-bold mr-2" title="IMDb Rating: ${imdbScore}">
            <i class="fas fa-star text-[10px]" style="margin-right: 4px; position: relative; top: -0.5px"></i>
            <span>${imdbScore}</span>
        </div>
    `
}

        const aiBtnHtml = `
            <button onclick="app.getVibeCheck('${safeTitle}', '${movie.Year}')" class="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 p-1.5 rounded-full transition-all" title="✨ AI Vibe Check">
                <i class="fas fa-magic text-sm"></i>
            </button>
        `

        metaGroupHtml = `
            <div class="ml-auto flex items-center">
                ${scoreHtml}
                ${aiBtnHtml}
            </div>
        `

        if (context === 'search') {
            if (isWatchlisted) {
                bottomControlsHtml = `
                    <button disabled class="w-full bg-gray-700 text-gray-400 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2">
                        <i class="fas fa-check"></i> Added
                    </button>
                `
            } else {
                bottomControlsHtml = `
                    <button onclick="app.addToWatchlist('${movie.imdbID}')" class="w-full bg-gray-800 hover:bg-yellow-500 hover:text-black text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group">
                        <i class="fas fa-plus group-hover:scale-110 transition-transform"></i> Watchlist
                    </button>
                `
            }
        } else {
            // --- REVERTED BACK TO YOUR WORKING WATCHLIST LOGIC ---
            let starsHtml = ''
            for (let i = 1; i <= 5; i++) {
                const type = i <= rating ? 'fas' : 'far'
                const colorClass = i <= rating ? 'text-yellow-500' : 'text-gray-600'
                starsHtml += `<i class="${type} fa-star text-base ${colorClass}" onclick="app.setRating('${movie.imdbID}', ${i})"></i>`
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
            `

            bottomControlsHtml = `
                <button onclick="app.removeFromWatchlist('${movie.imdbID}')" class="w-full text-xs text-red-400 hover:text-red-300 py-2 hover:bg-red-900/20 rounded transition-colors text-center border border-transparent hover:border-red-900/30">
                    Remove from List
                </button>
            `
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
        `
    },

    addToWatchlist: function(imdbID) {
        if (!this.user) {
            this.showToast("Initializing cloud sync...")
            return
        }
        
        // Find the movie in the search results
        const searchMovie = this.currentResults.find(m => m.imdbID === imdbID)
        
        // Prevent dupes
        if (searchMovie && !this.watchlist.some(m => m.imdbID === imdbID)) {
            // 1. Make a standalone clone of the movie object
            const movieToSave = { ...searchMovie }
            
            // 2. Set default watchlist states
            movieToSave.isWatched = false
            movieToSave.rating = 0
            
            // 3. THE FIX: Strip the AI tag so it saves as a normal, clean movie
            delete movieToSave.isAiSuggestion
            
            // 4. Save and re-render
            this.watchlist.push(movieToSave)
            this.saveWatchlistToCloud()
            this.renderSearchResults(this.currentResults) 
            this.showToast(`Added "${movieToSave.Title}" to watchlist`)
        }
    },

    removeFromWatchlist: function(imdbID) {
        if (!this.user) return
        this.watchlist = this.watchlist.filter(m => m.imdbID !== imdbID)
        this.saveWatchlistToCloud()
        this.renderWatchlist()
        this.showToast('Movie removed from watchlist')
    },

    showToast: function(message) {
        const toast = document.getElementById('toast')
        document.getElementById('toast-message').innerText = message
        toast.classList.remove('translate-y-20', 'opacity-0')
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0')
        }, 3000)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    app.init()
})

