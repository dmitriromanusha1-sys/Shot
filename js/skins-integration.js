document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.skinsModule) {
            window.skinsModule.integrateWithGame();
        }
    }, 500);
});
