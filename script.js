console.log("Script loaded successfully!")


window.app = {
    searchMode: 'title',

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
                const input = document.getElementById('search-input')
                console.log(`Searching for: ${input.value} in mode: ${this.searchMode}`)
            })
        }
    },

    toggleSearchMode: function() {
        const checkbox = document.getElementById('search-mode-toggle')
        const labelTitle = document.getElementById('label-title')
        const labelMood = document.getElementById('label-mood')
        const icon = document.getElementById('search-icon')
        const input = document.getElementById('search-input')
        const searchContBg = document.getElementById('search-container-bg')
        const moodHint = document.getElementById('mood-hint')
        const searchBtnAction = document.getElementById('btn-search-action')

        if (checkbox.checked) {
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
    }
}



// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener("DOMContentLoaded", () => {
    window.app.init()
})

