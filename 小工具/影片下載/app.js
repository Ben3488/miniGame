// Cobalt API Nodes List
const COBALT_SERVERS = [
    { name: "Meowing Subito (推薦)", url: "https://subito-c.meowing.de" },
    { name: "Meowing Nuko", url: "https://nuko-c.meowing.de" },
    { name: "Clxxped Grapefruit", url: "https://grapefruit.clxxped.lol" },
    { name: "Mgytr Node", url: "https://apicobalt.mgytr.top" },
    { name: "Kittycat Fox", url: "https://fox.kittycat.boo" },
    { name: "Kittycat Dog", url: "https://dog.kittycat.boo" },
    { name: "Qwkuns Node", url: "https://api.qwkuns.me" },
    { name: "Canine Tools", url: "https://cobalt.omega.wolfy.love" },
    { name: "Clxxped Lime", url: "https://lime.clxxped.lol" },
    { name: "Squair Node", url: "https://cobaltapi.squair.xyz" }
];

// Application State
let appState = {
    servers: [...COBALT_SERVERS],
    activeServerUrl: "",
    isAudioOnly: false,
    history: []
};

// DOM Elements
const videoUrlInput = document.getElementById("video-url");
const pasteBtn = document.getElementById("paste-btn");
const downloadBtn = document.getElementById("download-btn");
const segmentBtns = document.querySelectorAll(".segment-btn");
const qualityContainer = document.getElementById("quality-selector-container");
const audioContainer = document.getElementById("audio-format-container");
const videoQualitySelect = document.getElementById("video-quality");
const audioFormatSelect = document.getElementById("audio-format");
const apiNodeSelect = document.getElementById("api-node");
const customNodeBtn = document.getElementById("custom-node-btn");
const serverStatusPill = document.getElementById("server-status-pill");

// Cards
const loaderCard = document.getElementById("loader-card");
const loaderTitle = document.getElementById("loader-title");
const loaderSubtitle = document.getElementById("loader-subtitle");
const resultCard = document.getElementById("result-card");
const closeResultBtn = document.getElementById("close-result");

// Result Elements
const resultThumbnail = document.getElementById("result-thumbnail");
const resultDuration = document.getElementById("result-duration");
const resultTitle = document.getElementById("result-title");
const resultTypeTag = document.getElementById("result-type-tag");
const resultQualityTag = document.getElementById("result-quality-tag");
const resultServerTag = document.getElementById("result-server-tag");
const saveFileBtn = document.getElementById("save-file-btn");

// History Elements
const historyEmpty = document.getElementById("history-empty");
const historyGrid = document.getElementById("history-grid");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// Modal Elements
const settingsModal = document.getElementById("settings-modal");
const modalCloses = document.querySelectorAll(".modal-close");
const customApiUrlInput = document.getElementById("custom-api-url");
const customApiKeyInput = document.getElementById("custom-api-key");
const saveModalBtn = document.getElementById("save-modal-btn");

// Toast Container
const toastContainer = document.getElementById("toast-container");

/* --- Initialization --- */
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Load Settings & History from LocalStorage
    loadSettings();
    loadHistory();
    
    // Ping all servers to find the fastest
    initServerPing();
    
    // Set up Event Listeners
    initEventListeners();
});

/* --- Server Ping & Selection --- */
async function initServerPing() {
    updateServerPill("pinging", "正在檢測下載節點延遲...");
    
    // Clear dynamic options first (keep 'auto' and 'custom' if active)
    const originalOptionsCount = apiNodeSelect.options.length;
    for (let i = originalOptionsCount - 1; i >= 0; i--) {
        if (apiNodeSelect.options[i].value !== "auto") {
            apiNodeSelect.remove(i);
        }
    }

    // Load custom server if exists
    const customServer = getCustomServer();
    if (customServer) {
        const customOpt = document.createElement("option");
        customOpt.value = customServer.url;
        customOpt.textContent = `🔧 自訂節點: ${customServer.url}`;
        apiNodeSelect.appendChild(customOpt);
    }
    
    // Populate base servers
    appState.servers.forEach(server => {
        const opt = document.createElement("option");
        opt.value = server.url;
        opt.textContent = `${server.name} (檢測中...)`;
        opt.id = `node-${btoa(server.url).replace(/=/g, '')}`;
        apiNodeSelect.appendChild(opt);
    });

    // Run parallel ping tests
    const pingPromises = appState.servers.map(async (server) => {
        const latency = await pingServer(server.url);
        return { ...server, latency };
    });

    const results = await Promise.all(pingPromises);
    
    // Sort servers by latency (filter out offline -1)
    const onlineServers = results
        .filter(s => s.latency > 0)
        .sort((a, b) => a.latency - b.latency);

    // Update Dropdown texts with latency
    results.forEach(server => {
        const option = document.getElementById(`node-${btoa(server.url).replace(/=/g, '')}`);
        if (option) {
            if (server.latency > 0) {
                option.textContent = `${server.name} (${server.latency}ms)`;
            } else {
                option.textContent = `${server.name} (離線/拒絕連線)`;
                option.disabled = true;
            }
        }
    });

    // Select active server
    if (customServer) {
        // If user set a custom server, default to it
        appState.activeServerUrl = customServer.url;
        apiNodeSelect.value = customServer.url;
        updateServerPill("online", `使用中: 自訂節點`);
    } else if (onlineServers.length > 0) {
        // Otherwise use the fastest online server
        const fastest = onlineServers[0];
        appState.activeServerUrl = fastest.url;
        updateServerPill("online", `最佳節點: ${fastest.name} (${fastest.latency}ms)`);
        
        // Update 'auto' selection behavior
        const autoOpt = apiNodeSelect.options[0];
        autoOpt.textContent = `自動分配: ${fastest.name} (${fastest.latency}ms)`;
    } else {
        updateServerPill("error", "所有公共節點皆無回應！請設定自訂節點。");
        showToast("error", "連線警報", "無法連線至任何公共下載節點，請前往設定自訂伺服器端點。");
    }
}

async function pingServer(url) {
    const start = performance.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        // Pinging is usually a GET or OPTIONS to root
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        // If we got here without throwing, the server is alive and responding (even with 405/404)
        const end = performance.now();
        return Math.round(end - start);
    } catch (e) {
        // Suppress console error as pings frequently fail CORS or timeout
    }
    return -1;
}

function updateServerPill(status, text) {
    serverStatusPill.className = `server-status-pill ${status}`;
    const indicator = serverStatusPill.querySelector(".status-indicator");
    indicator.className = `status-indicator ${status}`;
    const textNode = serverStatusPill.querySelector(".status-text");
    textNode.textContent = text;
}

/* --- Event Listeners --- */
function initEventListeners() {
    // Paste URL Button
    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                videoUrlInput.value = text;
                showToast("info", "貼上成功", "已貼上剪貼簿中的網址");
            }
        } catch (err) {
            showToast("error", "無法貼上", "請手動使用 Ctrl+V 貼上網址");
        }
    });

    // Download / Analyze Button
    downloadBtn.addEventListener("click", () => {
        const url = videoUrlInput.value.trim();
        if (!url) {
            showToast("error", "欄位空白", "請輸入 YouTube 影片連結！");
            return;
        }
        
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            showToast("error", "格式錯誤", "請輸入有效的網址 (需包含 http:// 或 https://)");
            return;
        }

        analyzeAndDownload(url);
    });

    // Enter Key on Input
    videoUrlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            downloadBtn.click();
        }
    });

    // Toggle Video vs Audio Mode
    segmentBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            segmentBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const value = btn.getAttribute("data-value");
            if (value === "audio") {
                appState.isAudioOnly = true;
                qualityContainer.classList.add("hidden");
                audioContainer.classList.remove("hidden");
            } else {
                appState.isAudioOnly = false;
                qualityContainer.classList.remove("hidden");
                audioContainer.classList.add("hidden");
            }
        });
    });

    // Node Dropdown Change
    apiNodeSelect.addEventListener("change", (e) => {
        const value = e.target.value;
        if (value === "auto") {
            initServerPing(); // Re-ping to find best
        } else {
            appState.activeServerUrl = value;
            const selectedText = e.target.options[e.target.selectedIndex].text;
            updateServerPill("online", `手動選擇: ${selectedText}`);
        }
    });

    // Modal Trigger
    customNodeBtn.addEventListener("click", () => {
        const customServer = getCustomServer();
        if (customServer) {
            customApiUrlInput.value = customServer.url;
            customApiKeyInput.value = customServer.key || "";
        }
        settingsModal.classList.remove("hidden");
    });

    // Modal Close
    modalCloses.forEach(el => {
        el.addEventListener("click", () => {
            settingsModal.classList.add("hidden");
        });
    });

    // Save Modal Settings
    saveModalBtn.addEventListener("click", () => {
        const url = customApiUrlInput.value.trim();
        const key = customApiKeyInput.value.trim();
        
        if (url) {
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                showToast("error", "設定失敗", "伺服器 URL 格式不正確");
                return;
            }
            saveCustomServer(url, key);
            showToast("success", "設定成功", "自訂下載伺服器已套用！");
            settingsModal.classList.add("hidden");
            initServerPing(); // Reload and select new server
        } else {
            // Clear custom server
            localStorage.removeItem("custom_cobalt_server");
            showToast("info", "重設成功", "已回復為公共伺服器");
            settingsModal.classList.add("hidden");
            initServerPing();
        }
    });

    // Close Result Card
    closeResultBtn.addEventListener("click", () => {
        resultCard.classList.add("hidden");
    });

    // Clear History Button
    clearHistoryBtn.addEventListener("click", () => {
        if (confirm("您確定要清除所有下載歷史記錄嗎？")) {
            appState.history = [];
            saveHistoryToStorage();
            renderHistory();
            showToast("info", "歷程已清除", "所有下載歷史記錄已清空");
        }
    });
}

/* --- Core Downloader Logic --- */
async function analyzeAndDownload(videoUrl) {
    // Clear old result
    resultCard.classList.add("hidden");
    
    // Show Loader
    loaderCard.classList.remove("hidden");
    loaderTitle.textContent = "正在取得影片資訊...";
    loaderSubtitle.textContent = "正在聯絡 YouTube 伺服器取得中繼資料...";

    let videoMetadata = {
        title: "YouTube 影片",
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop", // placeholder
        duration: "未知長度",
        videoId: extractVideoId(videoUrl)
    };

    // 1. Try to fetch rich metadata via YouTube oEmbed (CORS-friendly)
    if (videoMetadata.videoId) {
        try {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoMetadata.videoId}&format=json`;
            const metaResponse = await fetch(oEmbedUrl);
            if (metaResponse.ok) {
                const metaData = await metaResponse.json();
                videoMetadata.title = metaData.title || "YouTube 影片";
                videoMetadata.thumbnail = metaData.thumbnail_url || `https://img.youtube.com/vi/${videoMetadata.videoId}/mqdefault.jpg`;
                videoMetadata.author = metaData.author_name;
            } else {
                // Fallback to direct thumbnail url
                videoMetadata.thumbnail = `https://img.youtube.com/vi/${videoMetadata.videoId}/mqdefault.jpg`;
            }
        } catch (e) {
            // Fallback to direct thumbnail url
            videoMetadata.thumbnail = `https://img.youtube.com/vi/${videoMetadata.videoId}/mqdefault.jpg`;
        }
    }

    // 2. Call Cobalt API for Download Link
    loaderTitle.textContent = "解析影片下載流...";
    loaderSubtitle.textContent = `伺服器: ${appState.activeServerUrl || "自動分配"}`;

    if (!appState.activeServerUrl) {
        loaderCard.classList.add("hidden");
        showToast("error", "無可用伺服器", "目前沒有設定下載伺服器！請至進階設定配置。");
        return;
    }

    // Prepare Request Body (Support both v7 and v10+ schemas simultaneously)
    const requestBody = {
        url: videoUrl,
        filenameStyle: "pretty"
    };

    if (appState.isAudioOnly) {
        // v7 keys
        requestBody.isAudioOnly = true;
        // v10 keys
        requestBody.downloadMode = "audio";
        
        requestBody.audioFormat = audioFormatSelect.value;
    } else {
        // v7 keys
        requestBody.vQuality = videoQualitySelect.value;
        // v10 keys
        requestBody.videoQuality = videoQualitySelect.value;
        requestBody.downloadMode = "auto";
    }

    // Load custom authorization key if custom server is active
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    const customServer = getCustomServer();
    if (customServer && appState.activeServerUrl === customServer.url && customServer.key) {
        headers["Authorization"] = `Bearer ${customServer.key}`;
    }

    // Determine target endpoints (v10 root endpoint '/' takes precedence, fallback to v7 '/api/json')
    const baseUrl = appState.activeServerUrl.replace(/\/$/, "");
    let urlsToTry = [];
    if (appState.activeServerUrl.includes("/api/json")) {
        urlsToTry = [appState.activeServerUrl, baseUrl.replace("/api/json", "")];
    } else {
        urlsToTry = [baseUrl, `${baseUrl}/api/json`];
    }

    try {
        let response = null;
        let lastError = null;

        for (const url of urlsToTry) {
            try {
                response = await fetch(url, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
                
                if (response.status === 404) {
                    continue;
                }
                
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const errMsg = errData.error && errData.error.code ? errData.error.code : `HTTP 錯誤碼: ${response.status}`;
                    lastError = new Error(errMsg);
                    continue;
                }
                
                break;
            } catch (err) {
                lastError = err;
            }
        }

        // Hide Loader
        loaderCard.classList.add("hidden");

        if (!response || !response.ok) {
            throw lastError || new Error("無法與下載伺服器建立連線");
        }

        const data = await response.json();

        if (data.status === "error") {
            const code = data.error?.code || "unknown_error";
            throw new Error(`伺服器解析錯誤: ${code}`);
        }

        if (data.status === "redirect" || data.status === "stream") {
            // Success!
            const downloadUrl = data.url;
            
            // Build UI displays
            resultTitle.textContent = videoMetadata.title;
            resultThumbnail.src = videoMetadata.thumbnail;
            
            // Format Quality / Type tag
            resultTypeTag.textContent = appState.isAudioOnly ? "音訊" : "影片";
            resultTypeTag.className = `meta-tag ${appState.isAudioOnly ? "audio" : "video"}`;
            
            const selectedQuality = appState.isAudioOnly ? audioFormatSelect.value.toUpperCase() : `${videoQualitySelect.value}p`;
            resultQualityTag.textContent = selectedQuality;
            
            const serverName = appState.servers.find(s => s.url === appState.activeServerUrl)?.name || "自訂伺服器";
            resultServerTag.textContent = `伺服器: ${serverName}`;
            
            // Set save button link
            saveFileBtn.href = downloadUrl;
            
            // Reveal Result Card
            resultCard.classList.remove("hidden");
            resultCard.scrollIntoView({ behavior: 'smooth' });
            
            // Show Success Notification
            showToast("success", "解析成功！", "已成功取得下載連結，可點選下載按鈕。");
            
            // Add to history
            addToHistory({
                title: videoMetadata.title,
                thumbnail: videoMetadata.thumbnail,
                originalUrl: videoUrl,
                downloadUrl: downloadUrl,
                isAudio: appState.isAudioOnly,
                format: selectedQuality,
                timestamp: Date.now()
            });

        } else if (data.status === "picker") {
            // For playlists or pickers
            showToast("info", "清單下載", "此連結包含多個媒體項目，將為您下載第一個項目。");
            const downloadUrl = data.picker[0].url;
            resultTitle.textContent = videoMetadata.title;
            resultThumbnail.src = data.picker[0].thumb || videoMetadata.thumbnail;
            resultTypeTag.textContent = appState.isAudioOnly ? "音訊" : "影片";
            resultQualityTag.textContent = "Auto";
            saveFileBtn.href = downloadUrl;
            resultCard.classList.remove("hidden");
            
            addToHistory({
                title: videoMetadata.title,
                thumbnail: resultThumbnail.src,
                originalUrl: videoUrl,
                downloadUrl: downloadUrl,
                isAudio: appState.isAudioOnly,
                format: "Auto",
                timestamp: Date.now()
            });
        } else {
            throw new Error(`未知的回應狀態: ${data.status}`);
        }

    } catch (err) {
        loaderCard.classList.add("hidden");
        showToast("error", "解析失敗", err.message || "未知網路錯誤，請嘗試切換其他節點。");
    }
}

/* --- Storage & Settings Helper --- */
function loadSettings() {
    const savedAudio = localStorage.getItem("is_audio_only");
    if (savedAudio === "true") {
        appState.isAudioOnly = true;
        document.querySelector('[data-value="audio"]').click();
    }
}

function getCustomServer() {
    const data = localStorage.getItem("custom_cobalt_server");
    return data ? JSON.parse(data) : null;
}

function saveCustomServer(url, key) {
    localStorage.setItem("custom_cobalt_server", JSON.stringify({ url, key }));
}

/* --- History Manager --- */
function loadHistory() {
    const stored = localStorage.getItem("tubeflow_history");
    if (stored) {
        try {
            appState.history = JSON.parse(stored);
        } catch(e) {
            appState.history = [];
        }
    }
    renderHistory();
}

function saveHistoryToStorage() {
    localStorage.setItem("tubeflow_history", JSON.stringify(appState.history));
}

function addToHistory(item) {
    // Remove if duplicates exist based on download link or title
    appState.history = appState.history.filter(h => h.downloadUrl !== item.downloadUrl);
    
    // Add to top of list
    appState.history.unshift(item);
    
    // Keep max 15 items
    if (appState.history.length > 15) {
        appState.history.pop();
    }
    
    saveHistoryToStorage();
    renderHistory();
}

function renderHistory() {
    if (appState.history.length === 0) {
        historyEmpty.classList.remove("hidden");
        historyGrid.classList.add("hidden");
        clearHistoryBtn.classList.add("hidden");
    } else {
        historyEmpty.classList.add("hidden");
        historyGrid.classList.remove("hidden");
        clearHistoryBtn.classList.remove("hidden");
        
        historyGrid.innerHTML = "";
        
        appState.history.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "history-item";
            
            const timeAgo = formatTimeAgo(item.timestamp);
            const typeLabel = item.isAudio ? "音訊" : "影片";
            const typeClass = item.isAudio ? "audio" : "video";
            
            card.innerHTML = `
                <div class="history-thumbnail-wrapper">
                    <img src="${item.thumbnail}" alt="${item.title}">
                </div>
                <div class="history-item-body">
                    <h4 class="history-item-title" title="${item.title}">${item.title}</h4>
                    <div class="history-item-meta">
                        <span class="history-item-type ${typeClass}">${typeLabel} (${item.format})</span>
                        <a href="${item.downloadUrl}" target="_blank" rel="noopener noreferrer" class="history-item-link">
                            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                            <span>下載</span>
                        </a>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-align: right; margin-top: auto;">
                        ${timeAgo}
                    </span>
                </div>
            `;
            
            historyGrid.appendChild(card);
        });
        
        // Re-apply Lucide Icons to injected content
        lucide.createIcons();
    }
}

function formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (mins < 1) return "剛剛";
    if (mins < 60) return `${mins} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    return `${days} 天前`;
}

/* --- Toast System --- */
function showToast(type, title, message) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <div class="toast-content">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 2px;">${title}</h4>
            <p class="toast-message">${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Animate In
    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 10);
    
    // Auto Remove after 4s
    const hideTimeout = setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Utility to parse video ID
function extractVideoId(url) {
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    regExp = /\/shorts\/([a-zA-Z0-9_-]{11})/;
    match = url.match(regExp);
    if (match) {
        return match[1];
    }
    
    return null;
}
