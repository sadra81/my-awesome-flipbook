document.addEventListener('DOMContentLoaded', () => {
    // Select the flipbook container element
    const flipbookElement = document.getElementById('flipbook');
    // Select the magazine viewport element
    const magazineViewport = $('.magazine-viewport');

    // Ensure jQuery is loaded before initializing Turn.js
    if (typeof jQuery === 'undefined') {
        console.error("jQuery is not loaded. Turn.js requires jQuery to function correctly.");
        return;
    }

    // --- SCISSOR EFFECT REMOVED ---
    // The line $('#flipbook .page').eq(3).scissor(); has been removed.
    // If you wish to re-enable it or apply it to a different page,
    // you can add it back here, targeting the desired page element.
    // -----------------------------

    // Initialize Turn.js on the flipbook element
    $(flipbookElement).turn({
        width: 800, // Width of the book (two pages side-by-side)
        height: 500, // Height of the book
        autoCenter: true, // Centers the book horizontally
        gradients: true, // Enables realistic page shadows
        acceleration: true, // Improves performance on some devices
        display: 'double', // 'single' or 'double' page display
        elevation: 50, // Shadow depth
        when: {
            turning: function(event, page, view) { },
            start: function(event, page, view) { }
        }
    });

    // Initialize the zoom plugin on the magazine viewport
    magazineViewport.zoom({
        flipbook: $(flipbookElement),
        max: 2 // Max zoom level, adjust as needed (e.g., 2 for 200%)
    });

    // Add double-click event for zooming on the magazine viewport
    magazineViewport.on('dblclick', function(event) {
        if (magazineViewport.zoom('value') === 1) { // 1 means not zoomed
            magazineViewport.zoom('zoomIn', event); // Pass the event directly
        } else {
            magazineViewport.zoom('zoomOut');
        }
    });

    // Handle window resize to make the flipbook responsive
    $(window).bind('resize', function(){
        // Get the parent container's width
        var containerWidth = magazineViewport.parent().width();
        var newWidth = containerWidth;
        var newHeight = containerWidth / 1.6; // Assuming 800x500 aspect ratio (1.6)

        // Ensure it doesn't exceed a maximum height if desired
        if (newHeight > 500) { // Max height for book
            newHeight = 500;
            newWidth = newHeight * 1.6;
        }

        // Ensure it doesn't go below min width/height
        if (newWidth < 300) { // Min width for book
            newWidth = 300;
            newHeight = newWidth / 1.6;
        }

        // Resize the viewport and then the flipbook
        magazineViewport.css({
            width: newWidth,
            height: newHeight
        });
        $(flipbookElement).turn('size', newWidth, newHeight);

        // If zoomed in, re-adjust zoom to new size
        if (magazineViewport.zoom('value') > 1) {
            magazineViewport.zoom('resize');
        }

    }).bind('hashchange', function(){
        var page = window.location.hash.replace('#','');
        if (page) {
            $(flipbookElement).turn('page', page);
        }
    });

    // Initial resize call to set the correct size on load
    $(window).trigger('resize');
});
