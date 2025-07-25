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

    let map;
    const mapContainer = document.getElementById('map-container');
    const mapModalOverlay = document.getElementById('map-modal-overlay');
    const toggleBtn = document.getElementById('toggle-map-size');

    // Store the original parent of the mapContainer to put it back later
    const originalMapParent = mapContainer.parentNode;

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
            turning: function(event, page, view) {
                // If turning away from the map page (Page 3 or 4 in a spread), destroy the map to prevent issues
                // This condition means: if the *next* page ('page' parameter) is NOT 3 AND NOT 4, then destroy the map.
                // This allows the map to persist when flipping between 3 and 4, or 4 to 3.
                if (map && (page !== 3 && page !== 4)) {
                    map.remove();
                    map = null; // Clear the map object
                }
            },
            turned: function(event, page, view) {
                // Initialize map when page 2 OR page 3 becomes active.
                // This covers cases for single page (page 3) and double page spreads (page 2 & 3).
                if (page === 2 || page === 3) {
                    if (!map) { // Only initialize if map doesn't exist
                        const lat = 35.7219;
                        const lng = 51.3890;
                        const zoom = 13;

                        // Initialize the map with scrollWheelZoom disabled
                        map = L.map('map', { scrollWheelZoom: false }).setView([lat, lng], zoom);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);

                        L.marker([lat, lng]).addTo(map)
                            .bindPopup('ما اینجاییم')
                            .openPopup();
                    }
                    // Invalidate size after the page has fully turned and rendered
                    // A small delay ensures the DOM has settled and map container has its final size.
                    setTimeout(() => {
                        if (map) { // Check if map object still exists
                            map.invalidateSize();
                        }
                    }, 200);
                }
            }
        }
    });

    // Snapshot zoom and pan logic (your existing code, mostly unchanged)
    let isZoomed = false;
    let zoomLevel = 2; // Adjust zoom level as needed
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = 0;
    let translateY = 0;

    $magazineViewport.on('mousedown touchstart', '#zoom-container', function(e) {
        if (!isZoomed) return;
        isDragging = true;
        lastX = e.clientX || e.originalEvent.touches[0].clientX;
        lastY = e.clientY || e.originalEvent.touches[0].clientY;
        $(this).css('cursor', 'grabbing');
    });

    $magazineViewport.on('mousemove touchmove', '#zoom-container', function(e) {
        if (!isDragging || !isZoomed) return;
        e.preventDefault();
        const clientX = e.clientX || e.originalEvent.touches[0].clientX;
        const clientY = e.clientY || e.originalEvent.touches[0].clientY;
        const dx = clientX - lastX;
        const dy = clientY - lastY;
        translateX += dx;
        translateY += dy;
        $(this).css('transform', `scale(${zoomLevel}) translate(${translateX / zoomLevel}px, ${translateY / zoomLevel}px)`);
        lastX = clientX;
        lastY = clientY;
    });

    $magazineViewport.on('mouseup touchend', '#zoom-container', function() {
        isDragging = false;
        $(this).css('cursor', 'grab');
    });

    $magazineViewport.on('click', function(e) {
        // Prevent click events on the map and its controls from triggering book zoom
        if ($(e.target).closest('#map-container').length || $(e.target).closest('#map-modal-overlay').length) {
            return;
        }

        if ($(e.target).closest('.page').length && !$(e.target).is('a')) {
            isZoomed = !isZoomed;
            if (isZoomed) {
                $(this).css({
                    'transform': `scale(${zoomLevel})`,
                    'transform-origin': 'center center',
                    'transition': 'transform 0.3s ease-out'
                });
                // Disable Turn.js page turning when zoomed
                $(flipbookElement).turn('disable', true);
            } else {
                $(this).css({
                    'transform': 'scale(1)',
                    'transform-origin': 'center center',
                    'transition': 'transform 0.3s ease-out'
                });
                translateX = 0;
                translateY = 0;
                // Enable Turn.js page turning when unzoomed
                $(flipbookElement).turn('disable', false);
            }
        }
    });

    // Handle window resize to adjust flipbook size
    $(window).on('resize', function() {
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        const containerWidth = $(window).width();
        const containerHeight = $(window).height();
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

        // If the map is currently on display or in modal, invalidate its size after resize
        const currentPage = $(flipbookElement).turn('page');
        if (map && (currentPage === 3 || currentPage === 4 || mapModalOverlay.classList.contains('active'))) {
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 100);
        }
    }).trigger('resize');

    if (toggleBtn && mapContainer && mapModalOverlay) {
        toggleBtn.addEventListener('click', function() {
            if (!map) { // Map must be initialized to toggle fullscreen
                console.warn("Map not initialized. Cannot toggle fullscreen.");
                return;
            }

            if (!mapContainer.classList.contains('fullscreen')) { // Entering fullscreen modal
                // Move map container to modal overlay
                mapModalOverlay.appendChild(mapContainer);
                mapContainer.classList.add('fullscreen'); // Add fullscreen class for modal stretching
                mapModalOverlay.classList.add('active'); // Activate modal overlay styles
                toggleBtn.textContent = '✕ Exit Fullscreen';

                // Invalidate size and recenter map after it's in the modal and visible
                setTimeout(() => {
                    if (map) {
                        map.invalidateSize();
                        map.setView([35.7219, 51.3890], map.getZoom() || 13); // Recenter or use current zoom
                    }
                }, 300); // Wait for modal transition

            } else { // Exiting fullscreen modal
                // Move map container back to its original place
                originalMapParent.appendChild(mapContainer);
                mapContainer.classList.remove('fullscreen'); // Remove fullscreen class
                mapModalOverlay.classList.remove('active'); // Deactivate modal overlay styles
                toggleBtn.textContent = '⛶ Fullscreen';

                // Invalidate size after moving it back and ensuring it's in widget mode
                setTimeout(() => {
                    if (map) {
                        map.invalidateSize();
                    }
                }, 300); // Wait for modal transition
            }
        });

        // Close fullscreen on ESC key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mapModalOverlay.classList.contains('active')) {
                // Trigger the button click to use its existing logic
                toggleBtn.click();
            }
        });
    }
});
