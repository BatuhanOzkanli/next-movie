console.log("Script loaded successfully!")

// Will add app logic here in the future, for now just a placeholder
window.app = {
    init:function() {
        console.log("App initializing...")
        // This is where will set up event listeners
    }
}

// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener("DomContentLoaded", () => {
    window.app.init()
})

