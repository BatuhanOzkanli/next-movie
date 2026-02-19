console.log("Script loaded successfully!")


window.app = {
    searchMode: 'title',
    omdbKey: 'f4bcfb9c', // The API Key
    
    // Data Storage
    watchlist: [],
    currentResults: [],

    init:function() {
        
        console.log("App initializing...")
        
        // Set up event listener for the search mode toggle
        const toggle = document.getElementById("search-mode-toggle")
        if (toggle) {
            toggle.addEventListener('change', () => this.toggleSearchMode())
        }

        // Set up event listener for the search button (Just logging for now)
        const searchBtn = document.getElementById('btn-search-action')
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch()
            })
        }

        // Enter key listener
        const input = document.getElementById('search-input')
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch()
            })
        }
    },

    toggleSearchMode: function() {
        const modeToggle = document.getElementById('search-mode-toggle')
        const labelTitle = document.getElementById('label-title')
        const labelMood = document.getElementById('label-mood')
        const icon = document.getElementById('search-icon')
        const input = document.getElementById('search-input')
        const searchContBg = document.getElementById('search-container-bg')
        const moodHint = document.getElementById('mood-hint')
        const searchBtnAction = document.getElementById('btn-search-action')

        if (modeToggle.checked) {
            // Mode: AI Mood
            this.searchMode = 'mood'

            // Text Colors
            labelTitle.classList.remove('text-yellow-500')
            labelTitle.classList.add('text-gray-500')
            labelMood.classList.remove('text-gray-500')
            labelMood.classList.add('text-purple-400')

            // Icon & Input
            icon.classList.remove('fa-search')
            icon.classList.add('fa-sparkles', 'text-purple-500')
            input.placeholder = 'Describe your mood (e.g. "Sad 90s sci-fi")...'

            // Container Styling (Purple Glow)
            searchContBg.classList.add('border-purple-500/50', 'shadow-purple-900/20')
            searchContBg.classList.remove('border-gray-800')

            // Hint Text
            moodHint.classList.remove('hidden')

            // Button Styling
            searchBtnAction.classList.remove('bg-yellow-500', 'hover:bg-yellow-600', 'text-black')
            searchBtnAction.classList.add('bg-purple-600', 'hover:bg-purple-700', 'text-white')
            searchBtnAction.innerText = "Ask AI"
        }
        else {
            // Mode: Title Search (Standart Search)
            this.searchMode = 'title'

            // Reset everything back to normal
            labelTitle.classList.add('text-yellow-500')
            labelTitle.classList.remove('text-gray-500')
            labelMood.classList.add('text-gray-500')
            labelMood.classList.remove('text-purple-400')

            icon.classList.add('fa-search')
            icon.classList.remove('fa-sparkles', 'text-purple-500')
            input.placeholder = "Search for a movie (e.g. Blade Runner)..."

            searchContBg.classList.remove('border-purple-500/50', 'shadow-purple-900/20')
            searchContBg.classList.add('border-gray-800')

            moodHint.classList.add('hidden')

            searchBtnAction.classList.add('bg-yellow-500', 'hover:bg-yellow-600', 'text-black')
            searchBtnAction.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'text-white')
            searchBtnAction.innerText = "Search"
        }
    },

    handleSearch: function() {
        if (this.searchMode === 'mood') {
            console.log("AI Search not implemented yet.")
        }
        else {
            this.searchMovies()
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

    renderSearchResults: function(movies) {
        const grid = document.getElementById('search-grid')

        // Loop through movies and create HTML cards
        grid.innerHTML = movies.map(movie => 
            `<div class="movie-card bg-[#1A1A1A] rounded-xl overflow-hidden shadow-lg border border-gray-800 flex flex-col h-full relative group/card">

            <div class="relative aspect-[2/3] w-full bg-gray-800 overflow-hidden poster-container">
            ${movie.Poster !== 'N/A'
                ? `<img src="${movie.Poster}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full placeholder-poster"><i class="fas fa-film text-4xl"></i></div>`
            } 
            </div>

            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-white font-bold text-lg leading-tight mb-2 line-clamp-2" title="${movie.Title}">
                ${movie.Title}
                </h3>
                
                <div class="text-xs text-gray-400 mb-4 uppercase tracking-wide">
                ${movie.Year}
                </div>

                <div class="mt-auto pt-4 border-t border-gray-800">
                    <button onclick="app.addToWatchlist('${movie.imdbID}')" class="w-full bg-gray-800 hover:bg-yellow-500 hover:text-black text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group">
                        <i class="fas fa-plus group-hover:scale-110 transition-transform"></i>
                        Watchlist                    
                    </button>
                </div>
            </div>
        </div>`
        ).join('')
    },

    addToWatchlist: function(imdbID) {
        // Find the full movie object from our current search results
        const movie = this.currentResults.find(m => m.imdbID === imdbID)

        // Making sure the movie exist and isn't already in the watchlist
        if (movie && !this.watchlist.some(m => m.imdbID === imdbID)) {
            this.watchlist.push(movie)
            console.log("Current Watchlist:", this.watchlist)
            alert(`Added "${movie.Title}" to your watchlist!`)
        }
        else {
            alert("This movie is already in your watchlist!")
        }
    }

}



// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener("DOMContentLoaded", () => {
    window.app.init()
})

