$(document).ready(function() {
    // Select the flipbook container element
    const flipbookElement = document.getElementById('flipbook');
    // Select the magazine viewport element, ensuring it's a jQuery object
    const $magazineViewport = $('.magazine-viewport');

    // Ensure jQuery is loaded before initializing Turn.js
    if (typeof jQuery === 'undefined') {
        console.error("jQuery is not loaded. Turn.js requires jQuery to function correctly.");
        return;
    }

    // Initialize Turn.js on the flipbook element
    $(flipbookElement).turn({
        width: 800, // Default width (will be adjusted by resize)
        height: 500, // Default height (will be adjusted by resize)
        autoCenter: true, // Centers the book horizontally
        gradients: true, // Enables realistic page shadows
        acceleration: true, // Improves performance on some devices
        display: (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) ? 'single' : 'double', // 'single' or 'double' page display
        elevation: 50, // Shadow depth
        direction: 'rtl',
        when: {
            turning: function(event, page, view) { },
            start: function(event, page, view) { }
        }
    });

    // Snapshot zoom and pan logic
    let isZoomed = false;
    let zoomLevel = 2; // Adjust zoom level as needed
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = 0;
    let translateY = 0;

    $magazineViewport.on('dblclick', function(event) {
        const offset = $(this).offset();
        const clickX = event.pageX - offset.left;
        const clickY = event.pageY - offset.top;

        if (!isZoomed) {
            translateX = 0; // Reset position
            translateY = 0;
            $(flipbookElement).css({
                transform: 'scale(' + zoomLevel + ') translate(0px, 0px)',
                transformOrigin: clickX + 'px ' + clickY + 'px',
                transition: 'transform 0.3s ease'
            });
            isZoomed = true;
        } else {
            $(flipbookElement).css({
                transform: 'scale(1)',
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease'
            });
            isZoomed = false;
        }
    });

    $magazineViewport.on('mousedown', function(event) {
        if (isZoomed) {
            isDragging = true;
            lastX = event.pageX;
            lastY = event.pageY;
            event.preventDefault();
        }
    });

    $(document).on('mousemove', function(event) {
        if (isDragging && isZoomed) {
            let dx = event.pageX - lastX;
            let dy = event.pageY - lastY;
            translateX += dx;
            translateY += dy;
            $(flipbookElement).css({
                transform: 'scale(' + zoomLevel + ') translate(' + (translateX / zoomLevel) + 'px, ' + (translateY / zoomLevel) + 'px)',
                transition: 'none'
            });
            lastX = event.pageX;
            lastY = event.pageY;
        }
    });

    $(document).on('mouseup', function() {
        if (isDragging) {
            isDragging = false;
        }
    });

    // Handle window resize to make the flipbook responsive and larger
    $(window).bind('resize', function(){
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        const containerWidth = $(window).width(); // Use window width for overall container
        const containerHeight = $(window).height(); // Use window height for overall container

        let newWidth, newHeight;

        if (isMobilePortrait) {
            // For mobile portrait: single page, portrait aspect ratio (e.g., 3:4)
            const mobilePortraitAspectRatio = 0.75; // width / height = 3 / 4

            // Aim to fill almost the entire height, then calculate width
            newHeight = containerHeight * 0.98; // Use 98% of screen height for near-fullscreen
            newWidth = newHeight * mobilePortraitAspectRatio;

            // If calculated width is too large for the screen, adjust
            if (newWidth > containerWidth * 0.98) { // Use 98% of screen width
                newWidth = containerWidth * 0.98;
                newHeight = newWidth / mobilePortraitAspectRatio;
            }

            // Ensure minimum size (adjust as needed, but keep it low for responsiveness)
            if (newWidth < 250) {
                newWidth = 250;
                newHeight = newWidth / mobilePortraitAspectRatio;
            }

            // Adjust magazine-viewport to center and take up appropriate space
            $magazineViewport.css({
                width: newWidth,
                height: newHeight,
                'max-width': '100%',
                'max-height': '100%',
                'margin': 'auto' // Center it
            });

        } else {
            // For desktop or landscape mobile/tablet: double page, wider aspect ratio (e.g., 8:5)
            const desktopAspectRatio = 1.6; // width / height = 800 / 500

            // Aim to fill almost the entire width, then calculate height
            newWidth = containerWidth * 0.95; // Use 95% of screen width (leave minimal padding)
            newHeight = newWidth / desktopAspectRatio;

            // Adjust if height exceeds container height
            if (newHeight > containerHeight * 0.95) { // Use 95% of screen height
                newHeight = containerHeight * 0.95;
                newWidth = newHeight * desktopAspectRatio;
            }

            // Ensure minimum size (adjust as needed)
            if (newWidth < 600) {
                newWidth = 600;
                newHeight = newWidth / desktopAspectRatio;
            }

            $magazineViewport.css({
                width: newWidth,
                height: newHeight,
                'max-width': '100%', // Ensure it doesn't break out
                'max-height': '100%', // Ensure it doesn't break out
                'margin': 'auto' // Center it
            });
        }

        $(flipbookElement).turn('size', newWidth, newHeight);

        // Update display mode based on current orientation
        const flipbook = $(flipbookElement);
        const currentDisplay = flipbook.turn('option', 'display');
        const shouldBeSingle = isMobilePortrait ? 'single' : 'double';

        if (currentDisplay !== shouldBeSingle) {
            flipbook.turn('display', shouldBeSingle);
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
