/* ==========================================================================
   LED Marquee Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const previewContainer = document.getElementById('marquee-fullscreen-target');
    const textNode = document.getElementById('marquee-text-node');
    
    const inputText = document.getElementById('input-text');
    const inputSize = document.getElementById('input-size');
    const inputSpeed = document.getElementById('input-speed');
    const inputColor = document.getElementById('input-color');
    const inputGlow = document.getElementById('input-glow');
    const selectWeight = document.getElementById('select-weight');
    const selectStyle = document.getElementById('select-style');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    
    const valSize = document.getElementById('val-size');
    const valSpeed = document.getElementById('val-speed');

    // Helper to update hex text color span next to picker
    function updateHexLabel(inputEl) {
        const hexSpan = inputEl.nextElementSibling;
        if (hexSpan && hexSpan.classList.contains('color-picker-hex')) {
            hexSpan.textContent = inputEl.value.toUpperCase();
        }
    }

    // Main update function
    function updateMarquee() {
        // 1. Text Content
        textNode.textContent = inputText.value || ' ';

        // 2. Font Size
        const sizeVal = inputSize.value;
        valSize.textContent = sizeVal;
        textNode.style.fontSize = `${sizeVal}rem`;

        // 3. Scroll Speed (animation duration)
        const speedVal = inputSpeed.value;
        valSpeed.textContent = speedVal;
        textNode.style.animationDuration = `${speedVal}s`;

        // 4. Font Weight
        textNode.style.fontWeight = selectWeight.value;

        // 5. Colors and Effects
        const textColor = inputColor.value;
        const glowColor = inputGlow.value;
        const effectStyle = selectStyle.value;

        // Reset class list
        textNode.className = 'marquee-content';
        textNode.style.color = '';
        textNode.style.textShadow = '';

        // Add corresponding classes and colors
        if (effectStyle === 'neon') {
            textNode.classList.add('effect-neon');
            textNode.style.color = textColor;
            textNode.style.textShadow = `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 40px ${glowColor}`;
            textNode.style.setProperty('color', textColor);
        } else if (effectStyle === 'rainbow') {
            textNode.classList.add('effect-rainbow');
        } else if (effectStyle === 'blink') {
            textNode.classList.add('effect-blink');
            textNode.style.color = textColor;
            textNode.style.textShadow = `0 0 8px ${glowColor}`;
        } else {
            // Normal
            textNode.classList.add('effect-normal');
            textNode.style.color = textColor;
        }
    }

    // Event Listeners for configuration inputs
    inputText.addEventListener('input', updateMarquee);
    
    inputSize.addEventListener('input', updateMarquee);
    inputSpeed.addEventListener('input', updateMarquee);
    
    inputColor.addEventListener('input', () => {
        updateHexLabel(inputColor);
        updateMarquee();
    });
    
    inputGlow.addEventListener('input', () => {
        updateHexLabel(inputGlow);
        updateMarquee();
    });

    selectWeight.addEventListener('change', updateMarquee);
    selectStyle.addEventListener('change', updateMarquee);

    // ==========================================================================
    // Fullscreen API Handling
    // ==========================================================================
    function enterFullscreen() {
        const target = previewContainer;
        if (target.requestFullscreen) {
            target.requestFullscreen();
        } else if (target.mozRequestFullScreen) { // Firefox
            target.mozRequestFullScreen();
        } else if (target.webkitRequestFullscreen) { // Chrome, Safari and Opera
            target.webkitRequestFullscreen();
        } else if (target.msRequestFullscreen) { // IE/Edge
            target.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    // Toggle fullscreen on button click
    btnFullscreen.addEventListener('click', enterFullscreen);

    // Tap/Click on the preview box to exit fullscreen when active
    previewContainer.addEventListener('click', () => {
        const isFullscreen = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
        if (isFullscreen) {
            exitFullscreen();
        }
    });

    // Initialize labels & render marquee on load
    updateHexLabel(inputColor);
    updateHexLabel(inputGlow);
    updateMarquee();
});
