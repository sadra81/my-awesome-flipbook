$(document).ready(function() {
    const flipbookElement = document.getElementById('flipbook');
    const $magazineViewport = $('.magazine-viewport');

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
        width: 800,
        height: 500,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        display: (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) ? 'single' : 'double',
        elevation: 50,
        direction: 'rtl',
        when: {
            turning: function(event, page, view) {
                // If turning away from the map page (Page 2), destroy the map to prevent issues
                if (map && (page !== 2 && page !== 3)) { // Page 2 is the map page, 3 is its back side in double page view
                    map.remove();
                    map = null;
                }
            },
            turned: function(event, page, view) {
                // Initialize map only when it's on page 2 (the "به نام خدا" page)
                if (page === 2) {
                    if (!map) {
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
                    setTimeout(() => {
                        if (map) {
                            map.invalidateSize();
                        }
                    }, 200);
                }
            }
        }
    });

    // Snapshot zoom and pan logic (your existing code, mostly unchanged)
    let isZoomed = false;
    let zoomLevel = 2;
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
            newWidth = containerWidth * 0.95;
            newHeight = containerHeight * 0.85;
        } else {
            newWidth = containerWidth * 0.6;
            newHeight = newWidth / 1.6;
            if (newHeight > containerHeight * 0.8) {
                newHeight = containerHeight * 0.8;
                newWidth = newHeight * 1.6;
            }
        }

        $magazineViewport.css({
            width: newWidth + 'px',
            height: newHeight + 'px'
        });

        $(flipbookElement).turn('size', newWidth, newHeight);

        // If the map is currently on display or in modal, invalidate its size after resize
        const currentPage = $(flipbookElement).turn('page');
        if (map && (currentPage === 2 || currentPage === 3 || mapModalOverlay.classList.contains('active'))) {
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
