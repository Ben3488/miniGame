// State Variables
let originalImage = null;
let width = 0;
let height = 0;

// Canvas Elements
const displayCanvas = document.getElementById('display-canvas');
const displayCtx = displayCanvas.getContext('2d');

// Offscreen Canvases for processing
const originalCanvas = document.createElement('canvas');
const originalCtx = originalCanvas.getContext('2d');

const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d');

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

// Navigation & Transformation
let zoom = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;
let isSpaceBarHeld = false;

// Tools
let activeTool = 'wand'; // 'wand', 'chroma', 'eraser', 'brush', 'hand', 'ai'
let isDrawing = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Tool Settings
let tolerance = 20;
let feather = 0;
let brushSize = 30;
let brushHardness = 80;

// History Stack (Undo/Redo)
let history = [];
let historyIndex = -1;
let historyStateBeforeAction = null; // Stores mask state before active action
let lastClickPos = null;             // For real-time tolerance tuning
let lastClickedColor = null;         // For real-time tolerance tuning

// Background replacement settings
let backgroundType = 'transparent'; // 'transparent', 'color', 'gradient', 'image'
let backgroundColor = 'transparent';
let activeGradientId = '';
let backgroundImage = null;

// Comparing state
let isComparing = false;

// AI State
let aiCancelled = false;

// Gradient Presets mapping
const gradientPresets = {
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)': ['#f5f7fa', '#c3cfe2'],
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)': ['#667eea', '#764ba2'],
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)': ['#ff9a9e', '#fecfef'],
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)': ['#f093fb', '#f5576c'],
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)': ['#5ee7df', '#b490ca'],
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)': ['#4facfe', '#00f2fe'],
    'linear-gradient(135deg, #434343 0%, #000000 100%)': ['#434343', '#000000']
};

// --- DOM ELEMENTS ---
const appViewport = document.getElementById('canvas-viewport');
const transformWrapper = document.querySelector('.canvas-transform-wrapper');
const brushCursor = document.getElementById('brush-cursor');

const panelUpload = document.getElementById('panel-upload');
const panelEditor = document.getElementById('panel-editor');
const panelBackground = document.getElementById('panel-background');
const canvasEmptyState = document.getElementById('canvas-empty-state');

const fileInput = document.getElementById('file-input');
const bgFileInput = document.getElementById('bg-file-input');
const dropZone = document.getElementById('drop-zone');
const dragOverlay = document.getElementById('drag-overlay');

const valTolerance = document.getElementById('val-tolerance');
const inputTolerance = document.getElementById('input-tolerance');
const valFeather = document.getElementById('val-feather');
const inputFeather = document.getElementById('input-feather');
const valBrushSize = document.getElementById('val-brush-size');
const inputBrushSize = document.getElementById('input-brush-size');
const valBrushHardness = document.getElementById('val-brush-hardness');
const inputBrushHardness = document.getElementById('input-brush-hardness');

const settingsTolerance = document.getElementById('settings-tolerance');
const settingsFeather = document.getElementById('settings-feather');
const settingsBrush = document.getElementById('settings-brush');

// Action Buttons
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnCompare = document.getElementById('btn-compare');
const btnResetImage = document.getElementById('btn-reset-image');
const btnDownload = document.getElementById('btn-download');

// Floating Controls
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomFit = document.getElementById('btn-zoom-fit');
const zoomIndicator = document.getElementById('zoom-indicator');

// AI elements
const aiLoadingOverlay = document.getElementById('ai-loading-overlay');
const aiProgressBar = document.getElementById('ai-progress-bar');
const aiProgressText = document.getElementById('ai-progress-text');
const btnCancelAi = document.getElementById('btn-cancel-ai');

// Tool buttons
const toolBtns = {
    wand: document.getElementById('tool-wand'),
    chroma: document.getElementById('tool-chroma'),
    eraser: document.getElementById('tool-eraser'),
    brush: document.getElementById('tool-brush'),
    hand: document.getElementById('tool-hand'),
    ai: document.getElementById('tool-ai')
};

// --- INITIALIZATION & EVENTS ---
window.addEventListener('DOMContentLoaded', () => {
    setupUploadHandlers();
    setupToolHandlers();
    setupSliderHandlers();
    setupBackgroundHandlers();
    setupViewportNav();
    setupActionButtons();
    setupKeyboardShortcuts();
});

// --- FILE UPLOAD LOGIC ---
function setupUploadHandlers() {
    document.getElementById('btn-browse-file').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-empty-upload').addEventListener('click', () => fileInput.click());
    document.getElementById('btn-sample-image').addEventListener('click', () => loadSampleImage());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Drag-and-drop workspace triggers
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (originalImage) {
            dragOverlay.className = 'drag-overlay-active';
        }
    });

    dragOverlay.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragOverlay.className = 'drag-overlay-hidden';
    });

    window.addEventListener('dragover', (e) => e.preventDefault());

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.className = 'drag-overlay-hidden';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Sidebar small upload dropzone
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('請選擇有效的圖片檔案！');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            width = img.naturalWidth;
            height = img.naturalHeight;

            // Setup dimensions
            originalCanvas.width = width;
            originalCanvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;
            displayCanvas.width = width;
            displayCanvas.height = height;
            tempCanvas.width = width;
            tempCanvas.height = height;

            // Paint initial canvas
            originalCtx.clearRect(0, 0, width, height);
            originalCtx.drawImage(img, 0, 0);

            // Set mask to full opaque white
            maskCtx.fillStyle = '#ffffff';
            maskCtx.fillRect(0, 0, width, height);

            // Reset history
            history = [];
            historyIndex = -1;
            saveHistoryState();

            // Reset last click info
            lastClickPos = null;
            lastClickedColor = null;

            // Show UI panels
            panelUpload.classList.add('hidden');
            panelEditor.classList.remove('hidden');
            panelBackground.classList.remove('hidden');
            canvasEmptyState.classList.add('hidden');
            appViewport.classList.remove('hidden');

            // Enable action buttons
            btnCompare.disabled = false;
            btnResetImage.disabled = false;
            btnDownload.disabled = false;

            // Reset tools
            setTool('wand');

            // Fit to screen
            zoomToFit();
            renderDisplay();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- VIEWPORT ZOOM & PANNING ---
function setupViewportNav() {
    appViewport.addEventListener('wheel', (e) => {
        if (!originalImage) return;
        e.preventDefault();

        const rect = appViewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);

        const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.05), 30);

        // Adjust pan coordinates relative to mouse pointer
        panX = mouseX - (mouseX - panX) * (newZoom / zoom);
        panY = mouseY - (mouseY - panY) * (newZoom / zoom);
        zoom = newZoom;

        updateViewportTransform();
        updateZoomIndicator();
        updateBrushCursorSize();
    });

    appViewport.addEventListener('mousedown', (e) => {
        if (!originalImage) return;

        const rect = appViewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Space bar hold, hand tool, or middle click = Panning
        if (activeTool === 'hand' || isSpaceBarHeld || e.button === 1) {
            isPanning = true;
            appViewport.classList.add('grabbing-active');
            startX = mouseX - panX;
            startY = mouseY - panY;
            e.preventDefault();
            return;
        }

        // Draw tool clicking/dragging
        const imgCoords = viewportToImageCoords(mouseX, mouseY);
        if (!imgCoords) return;

        const { x, y } = imgCoords;

        if (activeTool === 'wand') {
            const origData = originalCtx.getImageData(0, 0, width, height).data;
            const p = (y * width + x) * 4;
            lastClickedColor = { r: origData[p], g: origData[p+1], b: origData[p+2], a: origData[p+3] };
            lastClickPos = { x, y };
            runMagicWand(x, y, tolerance, false);
        } else if (activeTool === 'chroma') {
            const origData = originalCtx.getImageData(0, 0, width, height).data;
            const p = (y * width + x) * 4;
            lastClickedColor = { r: origData[p], g: origData[p+1], b: origData[p+2] };
            lastClickPos = { x, y };
            runChromaKey(lastClickedColor.r, lastClickedColor.g, lastClickedColor.b, tolerance, false);
        } else if (activeTool === 'brush' || activeTool === 'eraser') {
            isDrawing = true;
            historyStateBeforeAction = maskCtx.getImageData(0, 0, width, height);
            lastMouseX = x;
            lastMouseY = y;
            drawBrushTip(x, y);
            renderDisplay();
        }
    });

    appViewport.addEventListener('mousemove', (e) => {
        const rect = appViewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isPanning) {
            panX = mouseX - startX;
            panY = mouseY - startY;
            updateViewportTransform();
            return;
        }

        const imgCoords = viewportToImageCoords(mouseX, mouseY);

        // Brush cursor tracking
        if (imgCoords && (activeTool === 'brush' || activeTool === 'eraser')) {
            brushCursor.classList.remove('hidden');
            brushCursor.style.left = `${mouseX}px`;
            brushCursor.style.top = `${mouseY}px`;
        } else {
            brushCursor.classList.add('hidden');
        }

        if (isDrawing && imgCoords) {
            const { x, y } = imgCoords;
            drawBrushStroke(lastMouseX, lastMouseY, x, y);
            lastMouseX = x;
            lastMouseY = y;
            renderDisplay();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            appViewport.classList.remove('grabbing-active');
        }
        if (isDrawing) {
            isDrawing = false;
            saveHistoryState();
        }
    });

    // Zoom Indicator Reset on Double Click
    zoomIndicator.addEventListener('dblclick', () => {
        if (originalImage) zoomToFit();
    });
}

function viewportToImageCoords(mouseX, mouseY) {
    const x = Math.floor((mouseX - panX) / zoom);
    const y = Math.floor((mouseY - panY) / zoom);
    if (x >= 0 && x < width && y >= 0 && y < height) {
        return { x, y };
    }
    return null;
}

function updateViewportTransform() {
    transformWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function updateZoomIndicator() {
    zoomIndicator.innerText = `${Math.round(zoom * 100)}%`;
}

function updateBrushCursorSize() {
    const screenBrushSize = brushSize * zoom;
    brushCursor.style.width = `${screenBrushSize}px`;
    brushCursor.style.height = `${screenBrushSize}px`;
}

function zoomToFit() {
    if (!originalImage) return;
    const vWidth = appViewport.clientWidth;
    const vHeight = appViewport.clientHeight;

    const scaleX = vWidth / width;
    const scaleY = vHeight / height;
    zoom = Math.min(scaleX, scaleY) * 0.9;

    panX = (vWidth - width * zoom) / 2;
    panY = (vHeight - height * zoom) / 2;

    updateViewportTransform();
    updateZoomIndicator();
    updateBrushCursorSize();
}

function zoomIn() {
    zoom = Math.min(zoom * 1.25, 30);
    updateViewportTransform();
    updateZoomIndicator();
    updateBrushCursorSize();
}

function zoomOut() {
    zoom = Math.max(zoom * 0.8, 0.05);
    updateViewportTransform();
    updateZoomIndicator();
    updateBrushCursorSize();
}

// --- TOOLS SELECTION ---
function setupToolHandlers() {
    Object.keys(toolBtns).forEach(tool => {
        toolBtns[tool].addEventListener('click', () => {
            if (tool === 'ai') {
                runAIBackgroundRemoval();
            } else {
                setTool(tool);
            }
        });
    });
}

function setTool(tool) {
    activeTool = tool;
    
    // UI active state
    Object.keys(toolBtns).forEach(t => {
        if (toolBtns[t]) {
            toolBtns[t].classList.toggle('active', t === tool);
        }
    });

    // Viewport cursor state
    appViewport.classList.toggle('grab-active', tool === 'hand');
    
    // Toggle UI settings panels
    settingsTolerance.classList.toggle('hidden', tool !== 'wand' && tool !== 'chroma');
    settingsFeather.classList.toggle('hidden', tool !== 'chroma');
    settingsBrush.classList.toggle('hidden', tool !== 'brush' && tool !== 'eraser');

    // Update settings slider states
    if (tool === 'wand' || tool === 'chroma') {
        inputTolerance.value = tolerance;
        valTolerance.innerText = tolerance;
    }
    if (tool === 'chroma') {
        inputFeather.value = feather;
        valFeather.innerText = `${feather} px`;
    }
    if (tool === 'brush' || tool === 'eraser') {
        inputBrushSize.value = brushSize;
        valBrushSize.innerText = `${brushSize} px`;
        inputBrushHardness.value = brushHardness;
        valBrushHardness.innerText = `${brushHardness}%`;
        updateBrushCursorSize();
    }
}

// --- SLIDER ADJUSTMENTS ---
function setupSliderHandlers() {
    inputTolerance.addEventListener('input', (e) => {
        tolerance = parseInt(e.target.value);
        valTolerance.innerText = tolerance;
        
        // Dynamic tuning logic
        if (lastClickPos && (activeTool === 'wand' || activeTool === 'chroma')) {
            if (activeTool === 'wand') {
                runMagicWand(lastClickPos.x, lastClickPos.y, tolerance, true);
            } else if (activeTool === 'chroma' && lastClickedColor) {
                runChromaKey(lastClickedColor.r, lastClickedColor.g, lastClickedColor.b, tolerance, true);
            }
        }
    });

    // Commit change on slider release
    inputTolerance.addEventListener('change', () => {
        if (lastClickPos && (activeTool === 'wand' || activeTool === 'chroma')) {
            // Keep the final mask state in history list properly
            saveHistoryState();
        }
    });

    inputFeather.addEventListener('input', (e) => {
        feather = parseInt(e.target.value);
        valFeather.innerText = `${feather} px`;
        
        if (lastClickPos && activeTool === 'chroma' && lastClickedColor) {
            runChromaKey(lastClickedColor.r, lastClickedColor.g, lastClickedColor.b, tolerance, true);
        }
    });

    inputFeather.addEventListener('change', () => {
        if (lastClickPos && activeTool === 'chroma') {
            saveHistoryState();
        }
    });

    inputBrushSize.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        valBrushSize.innerText = `${brushSize} px`;
        updateBrushCursorSize();
    });

    inputBrushHardness.addEventListener('input', (e) => {
        brushHardness = parseInt(e.target.value);
        valBrushHardness.innerText = `${brushHardness}%`;
    });
}

// --- MAGIC WAND ALGORITHM (FLOOD FILL) ---
function runMagicWand(startX, startY, tolVal, isSliderAdjustment = false) {
    if (!originalImage) return;

    if (!isSliderAdjustment) {
        // Record state before the action
        historyStateBeforeAction = maskCtx.getImageData(0, 0, width, height);
    }

    const origData = originalCtx.getImageData(0, 0, width, height).data;
    
    // Copy the pre-action mask to draw on
    const maskDataObj = new ImageData(
        new Uint8ClampedArray(historyStateBeforeAction.data),
        width,
        height
    );
    const maskData = maskDataObj.data;

    // Clicked pixel RGBA
    const startIdx = (startY * width + startX) * 4;
    const r0 = origData[startIdx];
    const g0 = origData[startIdx+1];
    const b0 = origData[startIdx+2];

    // Tolerance range in RGB distance space (max is ~442)
    const maxDistanceThreshold = tolVal * 3.0; 

    // Queue-based DFS Flood Fill
    const stack = [startY * width + startX];
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;

    while (stack.length > 0) {
        const idx = stack.pop();
        const x = idx % width;
        const y = Math.floor(idx / width);
        const p = idx * 4;

        // Current original pixel color
        const r = origData[p];
        const g = origData[p+1];
        const b = origData[p+2];

        // Euclidean distance in RGB
        const dist = Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2);

        if (dist <= maxDistanceThreshold) {
            // Set mask pixel to transparent (erased)
            maskData[p] = 0;
            maskData[p+1] = 0;
            maskData[p+2] = 0;
            maskData[p+3] = 0;

            // Push neighbors
            if (x > 0 && visited[idx - 1] === 0) {
                stack.push(idx - 1);
                visited[idx - 1] = 1;
            }
            if (x < width - 1 && visited[idx + 1] === 0) {
                stack.push(idx + 1);
                visited[idx + 1] = 1;
            }
            if (y > 0 && visited[idx - width] === 0) {
                stack.push(idx - width);
                visited[idx - width] = 1;
            }
            if (y < height - 1 && visited[idx + width] === 0) {
                stack.push(idx + width);
                visited[idx + width] = 1;
            }
        }
    }

    maskCtx.putImageData(maskDataObj, 0, 0);
    
    if (!isSliderAdjustment) {
        saveHistoryState();
    } else {
        // Just overwrite the current step for slider real-time feel
        history[historyIndex] = maskCtx.getImageData(0, 0, width, height);
    }
    
    renderDisplay();
}

// --- CHROMA KEY (COLOR ERASER) ---
function runChromaKey(r0, g0, b0, tolVal, isSliderAdjustment = false) {
    if (!originalImage) return;

    if (!isSliderAdjustment) {
        historyStateBeforeAction = maskCtx.getImageData(0, 0, width, height);
    }

    const origData = originalCtx.getImageData(0, 0, width, height).data;
    const maskDataObj = new ImageData(
        new Uint8ClampedArray(historyStateBeforeAction.data),
        width,
        height
    );
    const maskData = maskDataObj.data;

    // Euclidean distance threshold
    const threshold = tolVal * 3.0;
    const fRange = feather * 3.0; // Feather threshold range

    for (let i = 0; i < width * height; i++) {
        const p = i * 4;
        
        // Skip pixels that are already erased in original image
        if (origData[p+3] === 0) continue;

        const r = origData[p];
        const g = origData[p+1];
        const b = origData[p+2];

        const dist = Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2);

        if (dist <= threshold) {
            if (fRange > 0 && dist > threshold - fRange) {
                // Feather edge (smooth transparency transition)
                const ratio = (dist - (threshold - fRange)) / fRange; // 0 to 1
                const currentAlpha = maskData[p+3];
                const newAlpha = Math.min(currentAlpha, Math.round(ratio * 255));
                
                maskData[p] = 0;
                maskData[p+1] = 0;
                maskData[p+2] = 0;
                maskData[p+3] = newAlpha;
            } else {
                // Hard erase
                maskData[p] = 0;
                maskData[p+1] = 0;
                maskData[p+2] = 0;
                maskData[p+3] = 0;
            }
        }
    }

    maskCtx.putImageData(maskDataObj, 0, 0);

    if (!isSliderAdjustment) {
        saveHistoryState();
    } else {
        history[historyIndex] = maskCtx.getImageData(0, 0, width, height);
    }

    renderDisplay();
}

// --- MANUAL BRUSH / ERASER LOGIC ---
function drawBrushTip(cx, cy) {
    const rOuter = brushSize * 0.5;
    const rInner = rOuter * (brushHardness / 100);

    maskCtx.save();

    const grad = maskCtx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);

    if (activeTool === 'eraser') {
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        maskCtx.fillStyle = grad;
        maskCtx.globalCompositeOperation = 'destination-out';
    } else {
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        maskCtx.fillStyle = grad;
        maskCtx.globalCompositeOperation = 'source-over';
    }

    maskCtx.beginPath();
    maskCtx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    maskCtx.fill();

    maskCtx.restore();
}

function drawBrushStroke(x1, y1, x2, y2) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(Math.ceil(distance / (brushSize * 0.05)), 1);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        drawBrushTip(cx, cy);
    }
}

// --- RENDERING PIPELINE ---
function renderDisplay() {
    if (!originalImage) return;

    displayCtx.clearRect(0, 0, width, height);

    // If comparing mode is ON, draw original image and exit
    if (isComparing) {
        displayCtx.drawImage(originalCanvas, 0, 0);
        return;
    }

    // 1. Draw Selected Background
    drawSelectedBackground();

    // 2. Composite Mask with Original Image
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.drawImage(originalCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'source-over';

    // 3. Draw Cutout over Background
    displayCtx.drawImage(tempCanvas, 0, 0);
}

function drawSelectedBackground() {
    if (backgroundType === 'transparent') {
        return;
    }

    if (backgroundType === 'color') {
        displayCtx.fillStyle = backgroundColor;
        displayCtx.fillRect(0, 0, width, height);
    } else if (backgroundType === 'gradient' && activeGradientId) {
        const stops = gradientPresets[activeGradientId];
        if (stops) {
            const grad = displayCtx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, stops[0]);
            grad.addColorStop(1, stops[1]);
            displayCtx.fillStyle = grad;
            displayCtx.fillRect(0, 0, width, height);
        }
    } else if (backgroundType === 'image' && backgroundImage) {
        displayCtx.drawImage(backgroundImage, 0, 0, width, height);
    }
}

// --- BACKGROUND TAB SWITCHING ---
function setupBackgroundHandlers() {
    const tabs = document.querySelectorAll('.bg-tab');
    const colorContent = document.getElementById('bg-content-color');
    const gradContent = document.getElementById('bg-content-gradient');
    const imageContent = document.getElementById('bg-content-image');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const type = tab.getAttribute('data-type');
            backgroundType = type;

            colorContent.classList.add('hidden');
            gradContent.classList.add('hidden');
            imageContent.classList.add('hidden');

            if (type === 'color') {
                colorContent.classList.remove('hidden');
            } else if (type === 'gradient') {
                gradContent.classList.remove('hidden');
            } else if (type === 'image') {
                imageContent.classList.remove('hidden');
            }

            renderDisplay();
        });
    });

    // Solid color presets
    const colorPresetBtns = document.querySelectorAll('.color-preset-btn');
    colorPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            backgroundColor = btn.style.backgroundColor;
            renderDisplay();
        });
    });

    // Color picker
    const customColorInput = document.getElementById('bg-custom-color');
    customColorInput.addEventListener('input', (e) => {
        colorPresetBtns.forEach(b => b.classList.remove('active'));
        backgroundColor = e.target.value;
        renderDisplay();
    });

    // Gradient presets
    const gradPresetBtns = document.querySelectorAll('.grad-preset-btn');
    gradPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gradPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            activeGradientId = btn.getAttribute('data-grad');
            renderDisplay();
        });
    });

    // Custom background image upload
    const btnUploadBg = document.getElementById('btn-upload-bg');
    const bgPreview = document.getElementById('bg-image-preview');
    const btnRemoveBg = document.getElementById('btn-remove-bg');

    btnUploadBg.addEventListener('click', () => bgFileInput.click());
    
    bgFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    backgroundImage = img;
                    bgPreview.querySelector('img').src = event.target.result;
                    bgPreview.classList.remove('hidden');
                    renderDisplay();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    btnRemoveBg.addEventListener('click', (e) => {
        e.stopPropagation();
        backgroundImage = null;
        bgPreview.classList.add('hidden');
        bgPreview.querySelector('img').src = '';
        bgFileInput.value = '';
        renderDisplay();
    });
}

// --- HISTORY STATE LOGIC ---
function saveHistoryState() {
    const maskData = maskCtx.getImageData(0, 0, width, height);
    history = history.slice(0, historyIndex + 1);
    history.push(maskData);
    if (history.length > 25) {
        history.shift();
    } else {
        historyIndex++;
    }
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const maskState = history[historyIndex];
        maskCtx.putImageData(maskState, 0, 0);
        
        lastClickPos = null;
        lastClickedColor = null;

        renderDisplay();
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const maskState = history[historyIndex];
        maskCtx.putImageData(maskState, 0, 0);

        lastClickPos = null;
        lastClickedColor = null;

        renderDisplay();
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    btnUndo.disabled = (historyIndex <= 0);
    btnRedo.disabled = (historyIndex >= history.length - 1);
}

// --- KEYBOARD & INTERFACE ACTIONS ---
function setupActionButtons() {
    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);

    btnZoomIn.addEventListener('click', zoomIn);
    btnZoomOut.addEventListener('click', zoomOut);
    btnZoomFit.addEventListener('click', zoomToFit);

    // Compare Image Button
    btnCompare.addEventListener('mousedown', () => {
        if (!originalImage) return;
        isComparing = true;
        btnCompare.classList.add('active');
        renderDisplay();
    });
    window.addEventListener('mouseup', () => {
        if (isComparing) {
            isComparing = false;
            btnCompare.classList.remove('active');
            renderDisplay();
        }
    });

    // Reset Image Button
    btnResetImage.addEventListener('click', () => {
        if (!originalImage) return;
        if (confirm('確定要還原所有編輯，重新開始去背嗎？')) {
            maskCtx.fillStyle = '#ffffff';
            maskCtx.fillRect(0, 0, width, height);
            
            lastClickPos = null;
            lastClickedColor = null;

            saveHistoryState();
            renderDisplay();
        }
    });

    // Download / Save Button
    btnDownload.addEventListener('click', () => {
        if (!originalImage) return;
        const link = document.createElement('a');
        link.download = `smart_cutout_${Date.now()}.png`;
        link.href = displayCanvas.toDataURL('image/png');
        link.click();
    });
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpaceBarHeld) {
            isSpaceBarHeld = true;
            appViewport.classList.add('grab-active');
            isDrawing = false;
            e.preventDefault();
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === '=') {
            e.preventDefault();
            zoomIn();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
            zoomOut();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
            zoomToFit();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpaceBarHeld = false;
            appViewport.classList.remove('grab-active');
            appViewport.classList.remove('grabbing-active');
        }
    });
}

// --- AI AUTO-BACKGROUND REMOVAL ---
function runAIBackgroundRemoval() {
    if (!originalImage) return;

    const isAISupported = (typeof imglyBackgroundRemoval !== 'undefined');
    if (!isAISupported) {
        alert('AI 模組尚未載入完畢，請稍候重試。或者，您可以直接使用左側的魔術棒及橡皮擦工具進行去背！');
        return;
    }

    aiCancelled = false;
    aiLoadingOverlay.classList.remove('hidden');
    aiProgressBar.style.width = '0%';
    aiProgressText.innerText = '正在初始化模型 (0%)';

    btnCancelAi.onclick = () => {
        aiCancelled = true;
        aiLoadingOverlay.classList.add('hidden');
    };

    const imageSource = originalCanvas.toDataURL('image/png');

    const config = {
        progress: (key, current, total) => {
            if (aiCancelled) return;

            const pct = Math.round((current / total) * 100);
            let label = '正在處理...';

            if (key.includes('fetch')) {
                label = '正在下載 AI 輕量模型';
            } else if (key.includes('compile')) {
                label = '正在解析 AI 核心演算法';
            } else if (key.includes('inference')) {
                label = '正在智慧分析圖片邊緣輪廓';
            }

            aiProgressBar.style.width = `${pct}%`;
            aiProgressText.innerText = `${label} (${pct}%)`;
        }
    };

    imglyBackgroundRemoval.removeBackground(imageSource, config)
        .then(blob => {
            if (aiCancelled) return;

            const url = URL.createObjectURL(blob);
            const tempImg = new Image();
            tempImg.onload = () => {
                maskCtx.clearRect(0, 0, width, height);
                maskCtx.drawImage(tempImg, 0, 0);

                const maskDataObj = maskCtx.getImageData(0, 0, width, height);
                const maskData = maskDataObj.data;
                for (let i = 0; i < maskData.length; i += 4) {
                    const alpha = maskData[i + 3];
                    if (alpha > 10) {
                        maskData[i] = 255;
                        maskData[i+1] = 255;
                        maskData[i+2] = 255;
                    } else {
                        maskData[i] = 0;
                        maskData[i+1] = 0;
                        maskData[i+2] = 0;
                        maskData[i+3] = 0;
                    }
                }
                maskCtx.putImageData(maskDataObj, 0, 0);
                
                lastClickPos = null;
                lastClickedColor = null;

                saveHistoryState();
                renderDisplay();
                aiLoadingOverlay.classList.add('hidden');
                URL.revokeObjectURL(url);
            };
            tempImg.src = url;
        })
        .catch(err => {
            if (aiCancelled) return;
            console.error('AI error:', err);
            alert('AI 去背失敗。此功能需要網路連線，或可能此瀏覽器不支援 WebAssembly。您可以直接使用左側的魔術棒及橡皮擦進行手動去背！');
            aiLoadingOverlay.classList.add('hidden');
        });
}

// --- SAMPLE IMAGE GENERATOR FOR TESTING ---
function loadSampleImage() {
    width = 800;
    height = 600;

    originalCanvas.width = width;
    originalCanvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;
    displayCanvas.width = width;
    displayCanvas.height = height;
    tempCanvas.width = width;
    tempCanvas.height = height;

    originalCtx.fillStyle = '#00ff00'; 
    originalCtx.fillRect(0, 0, width, height);

    originalCtx.fillStyle = '#ffcc00'; // Yellow
    originalCtx.beginPath();
    originalCtx.arc(400, 300, 150, 0, Math.PI * 2);
    originalCtx.fill();

    originalCtx.fillStyle = '#ff9999'; // Pink
    originalCtx.beginPath();
    originalCtx.arc(300, 320, 25, 0, Math.PI * 2);
    originalCtx.arc(500, 320, 25, 0, Math.PI * 2);
    originalCtx.fill();

    originalCtx.fillStyle = '#222222'; // Dark grey
    originalCtx.beginPath();
    originalCtx.arc(340, 260, 15, 0, Math.PI * 2);
    originalCtx.arc(460, 260, 15, 0, Math.PI * 2);
    originalCtx.fill();
    
    originalCtx.fillStyle = '#ffffff';
    originalCtx.beginPath();
    originalCtx.arc(345, 255, 6, 0, Math.PI * 2);
    originalCtx.arc(465, 255, 6, 0, Math.PI * 2);
    originalCtx.fill();

    originalCtx.fillStyle = '#ff6600'; // Orange
    originalCtx.beginPath();
    originalCtx.moveTo(370, 290);
    originalCtx.lineTo(430, 290);
    originalCtx.lineTo(400, 330);
    originalCtx.closePath();
    originalCtx.fill();

    originalCtx.fillStyle = '#ff3333';
    originalCtx.beginPath();
    originalCtx.arc(280, 180, 25, 0, Math.PI * 2);
    originalCtx.arc(320, 180, 25, 0, Math.PI * 2);
    originalCtx.fill();
    originalCtx.fillStyle = '#ffffff';
    originalCtx.beginPath();
    originalCtx.arc(300, 180, 12, 0, Math.PI * 2);
    originalCtx.fill();

    const dataUrl = originalCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
        originalImage = img;

        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0, width, height);

        history = [];
        historyIndex = -1;
        saveHistoryState();

        lastClickPos = null;
        lastClickedColor = null;

        panelUpload.classList.add('hidden');
        panelEditor.classList.remove('hidden');
        panelBackground.classList.remove('hidden');
        canvasEmptyState.classList.add('hidden');
        appViewport.classList.remove('hidden');

        btnCompare.disabled = false;
        btnResetImage.disabled = false;
        btnDownload.disabled = false;

        setTool('wand');
        zoomToFit();
        renderDisplay();
    };
    img.src = dataUrl;
}
