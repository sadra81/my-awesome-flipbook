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

    // Variables to store the mapContainer's parent and next sibling *just before* entering fullscreen
    let tempOriginalParent = null;
    let tempOriginalNextSibling = null;

    // Define the event handler functions outside to allow removal and re-attachment
    function toggleFullscreenHandler() {
        if (!map) {
            console.warn("Map not initialized. Cannot toggle fullscreen.");
            return;
        }

        if (!mapContainer.classList.contains('fullscreen')) {
            // Store the current parent and next sibling *before* moving the mapContainer
            tempOriginalParent = mapContainer.parentNode;
            tempOriginalNextSibling = mapContainer.nextSibling;

            // Store original styles (these can be stringified as they are primitive values)
            const currentStyles = window.getComputedStyle(mapContainer);
            mapContainer.dataset.originalInlineStyles = JSON.stringify({
                width: mapContainer.style.width,
                height: mapContainer.style.height,
                position: currentStyles.position, // Use computed style for robustness
                top: currentStyles.top,
                left: currentStyles.left,
                margin: currentStyles.margin,
                display: currentStyles.display,
                justifyContent: currentStyles.justifyContent,
                alignItems: currentStyles.alignItems,
                transform: currentStyles.transform,
                zIndex: currentStyles.zIndex
            });

            // Apply fullscreen styles
            mapModalOverlay.appendChild(mapContainer);
            mapContainer.classList.add('fullscreen');
            mapModalOverlay.classList.add('active');
            toggleBtn.textContent = '✕ Exit Fullscreen';

            mapContainer.style.width = '90%';
            mapContainer.style.height = '90%';
            mapContainer.style.position = 'fixed';
            mapContainer.style.top = '50%';
            mapContainer.style.left = '50%';
            mapContainer.style.transform = 'translate(-50%, -50%)';
            mapContainer.style.margin = '0';
            mapContainer.style.display = 'flex';
            mapContainer.style.justifyContent = 'center';
            mapContainer.style.alignItems = 'center';
            mapContainer.style.zIndex = '1001';

            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        } else {
            // Restore original state using the stored tempOriginalParent and tempOriginalNextSibling
            if (tempOriginalParent) {
                if (tempOriginalNextSibling) {
                    tempOriginalParent.insertBefore(mapContainer, tempOriginalNextSibling);
                } else {
                    tempOriginalParent.appendChild(mapContainer);
                }
            } else {
                // Fallback if original parent is somehow lost (shouldn't happen with this fix)
                console.warn("Original parent not found, appending map to body as fallback.");
                document.body.appendChild(mapContainer);
            }

            mapContainer.classList.remove('fullscreen');
            mapModalOverlay.classList.remove('active');
            toggleBtn.textContent = '⛶ Fullscreen';

            // Restore all original inline styles
            const originalInlineStyles = JSON.parse(mapContainer.dataset.originalInlineStyles || '{}');
            Object.keys(originalInlineStyles).forEach(prop => {
                mapContainer.style[prop] = originalInlineStyles[prop];
            });

            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 300);
        }
    }

    function escapeKeyHandler(e) {
        if (e.key === 'Escape' && mapModalOverlay.classList.contains('active')) {
            toggleBtn.click();
        }
    }

    function setupFullscreenButton() {
        if (toggleBtn && mapContainer && mapModalOverlay) {
            // Remove existing listeners to prevent duplicates
            toggleBtn.removeEventListener('click', toggleFullscreenHandler);
            document.removeEventListener('keydown', escapeKeyHandler);

            // Add the listeners
            toggleBtn.addEventListener('click', toggleFullscreenHandler);
            document.addEventListener('keydown', escapeKeyHandler);
        }
    }

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
                if (map && (page !== 3 && page !== 2)) {
                    map.remove();
                    map = null;
                }
            },
            turned: function(event, page, view) {
                if (page === 2 || page === 3) {
                    if (!map) {
                        const lat = 35.7219;
                        const lng = 51.3890;
                        const zoom = 13;

                        map = L.map('map', { 
                            scrollWheelZoom: false,
                            doubleClickZoom: false,
                            touchZoom: false
                        }).setView([lat, lng], zoom);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);

                        L.marker([lat, lng]).addTo(map)
                            .bindPopup('ما اینجاییم')
                            .openPopup();

                        // Ensure fullscreen button setup is called every time the map is (re)initialized
                        setupFullscreenButton();
                    }
                    setTimeout(() => {
                        if (map) map.invalidateSize();
                    }, 200);
                }
            }
        }
    });

    // Zoom and pan logic
    let isZoomed = false;
    let zoomLevel = 2;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = 0;
    let translateY = 0;
    let lastTapTime = 0;

    function handleZoomToggle() {
        isZoomed = !isZoomed;
        if (isZoomed) {
            $magazineViewport.css({
                'transform': `scale(${zoomLevel})`,
                'transform-origin': 'center center',
                'transition': 'transform 0.3s ease-out',
                'cursor': 'grab'
            });
            $(flipbookElement).turn('disable', true);
        } else {
            $magazineViewport.css({
                'transform': 'scale(1)',
                'transform-origin': 'center center',
                'transition': 'transform 0.3s ease-out',
                'cursor': ''
            });
            translateX = 0;
            translateY = 0;
            $(flipbookElement).turn('disable', false);
        }
    }

    // Desktop double click
    $magazineViewport.on('dblclick', function(e) {
        if ($(e.target).closest('#map-container, #map-modal-overlay').length) return;
        if ($(e.target).closest('.page').length && !$(e.target).is('a')) {
            handleZoomToggle();
        }
    });

    // Mobile double tap
    $magazineViewport.on('touchstart', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            if ($(e.target).closest('#map-container, #map-modal-overlay').length) return;
            if ($(e.target).closest('.page').length && !$(e.target).is('a')) {
                handleZoomToggle();
            }
        }
        lastTapTime = currentTime;
    });

    // Panning functionality
    $magazineViewport.on('mousedown touchstart', function(e) {
        if (!isZoomed) return;
        isDragging = true;
        lastX = e.clientX || e.originalEvent.touches[0].clientX;
        lastY = e.clientY || e.originalEvent.touches[0].clientY;
        $(this).css('cursor', 'grabbing');
    });

    $magazineViewport.on('mousemove touchmove', function(e) {
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

    $magazineViewport.on('mouseup touchend mouseleave', function() {
        isDragging = false;
        $(this).css('cursor', isZoomed ? 'grab' : '');
    });

    $(window).on('resize', function() {
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        const containerWidth = $(window).width();
        const containerHeight = $(window).height();
        let newWidth, newHeight;

        if (isMobilePortrait) {
            const ratio = 0.75;
            newHeight = Math.min(containerHeight * 0.98, containerWidth / ratio * 0.98);
            newWidth = newHeight * ratio;
        } else {
            const ratio = 1.6;
            newWidth = Math.min(containerWidth * 0.95, containerHeight * ratio * 0.95);
            newHeight = newWidth / ratio;
        }

        $magazineViewport.css({
            width: newWidth,
            height: newHeight,
            'max-width': '100%',
            'max-height': '100%',
            'margin': 'auto'
        });

        $(flipbookElement).turn('size', newWidth, newHeight)
                          .turn('display', isMobilePortrait ? 'single' : 'double');

        if (map && ($(flipbookElement).turn('page') === 2 || $(flipbookElement).turn('page') === 3 || 
                   mapModalOverlay.classList.contains('active'))) {
            setTimeout(() => map && map.invalidateSize(), 100);
        }
    }).trigger('resize');
});
