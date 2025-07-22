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

    // --- NEW: Apply scissor effect to a specific page ---
    // The scissor plugin divides a page into two, creating a visual cut.
    // It's applied to the page element itself before Turn.js initializes.
    // For example, let's apply it to the third page (index 2, as pages are 0-indexed in jQuery selection).
    // In your index.html, Page 3 is the 4th div with class 'page' (after cover, page1, page2).
    // So, it's the 4th child of #flipbook, or index 3 if using .page selector.
    // Let's target the page with "Page 3" content.
    // Assuming the structure: cover, page1, page2, page3, page4, page5, back-cover
    // Page 3 is the 4th .page div, so it's at index 3 in a jQuery collection of .page.
    $('#flipbook .page').eq(3).scissor(); // Applies scissor to the 4th page div (which contains "Page 3" content)
    // You can apply this to any page you wish to "cut".
    // Note: The scissor effect visually splits the content. The second half of the content
    // will appear on the subsequent physical turn of the page.
    // ---------------------------------------------------

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
        var containerWidth = magazineViewport.parent().width();
        var newWidth = containerWidth;
        var newHeight = containerWidth / 1.6;

        if (newHeight > 500) {
            newHeight = 500;
            newWidth = newHeight * 1.6;
        }

        if (newWidth < 300) {
            newWidth = 300;
            newHeight = newWidth / 1.6;
        }

        magazineViewport.css({
            width: newWidth,
            height: newHeight
        });
        $(flipbookElement).turn('size', newWidth, newHeight);

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
