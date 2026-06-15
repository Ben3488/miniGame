/* ==========================================================================
   兒童表現計分板 (自訂人數版) - 核心應用程式邏輯 (app.js)
   ========================================================================== */

const STORAGE_VERSION_KEY = 'kids_multi_scoreboard_version';
const STORAGE_VERSION = 'multi-scoreboard-v2';
const MAX_AVATAR_UPLOADS = 5;
const SYNC_POLL_INTERVAL_MS = 2000;

// 預設常用原因與點數 (9 個項目)
const DEFAULT_PRESETS = [
    { icon: '🧹', label: '做家務', val: 3 },
    { icon: '🧸', label: '收拾玩具', val: 2 },
    { icon: '🛌', label: '摺被子', val: 1 },
    { icon: '💯', label: '考滿分', val: 10 },
    { icon: '📝', label: '寫作業', val: 2 },
    { icon: '🍙', label: '乖乖吃飯', val: 1 },
    { icon: '📚', label: '主動看書', val: 2 },
    { icon: '🌙', label: '準時睡覺', val: 1 },
    { icon: '🤝', label: '分享禮讓', val: 2 }
];

// 預設大頭貼 Emoji 列表 (收錄 80 款可愛兒童表情、笑臉、可愛動物及美食水果系列)
const CURED_EMOJIS = [
    // 笑臉與人物 (Smiles & Kids) - 20款
    '👶', '👧', '👦', '🧒', '👱', '😀', '😃', '😄', '😁', '😆',
    '😊', '😍', '🥰', '🥳', '😎', '🤩', '👽', '🤖', '🦸', '🧙',
    // 可愛動物 (Animals) - 30款
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🦄',
    '🦖', '🦕', '🐙', '🦑', '🐠', '🐬', '🐳', '🐢', '🦋', '🐞',
    // 美食與水果 (Food & Fruit) - 30款
    '🍎', '🍊', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭',
    '🍍', '🥥', '🥝', '🍅', '🥑', '🍔', '🍟', '🍕', '🍩', '🍪',
    '🧁', '🍫', '🍬', '🍭', '🍦', '🍨', '🍧', '🍰', '🎂', '🍙'
];

// 10 組美麗主題色彩配置，對應 index.html 裡的 SVG 漸層
const THEME_CONFIGS = [
    {
        gradientId: 'gradient-orange',
        glowColor: 'rgba(249, 115, 22, 0.15)',
        glowStrong: 'rgba(249, 115, 22, 0.45)',
        tagColor: '#f97316'
    },
    {
        gradientId: 'gradient-pink',
        glowColor: 'rgba(236, 72, 153, 0.15)',
        glowStrong: 'rgba(236, 72, 153, 0.45)',
        tagColor: '#ec4899'
    },
    {
        gradientId: 'gradient-blue',
        glowColor: 'rgba(59, 130, 246, 0.15)',
        glowStrong: 'rgba(59, 130, 246, 0.45)',
        tagColor: '#3b82f6'
    },
    {
        gradientId: 'gradient-green',
        glowColor: 'rgba(16, 185, 129, 0.15)',
        glowStrong: 'rgba(16, 185, 129, 0.45)',
        tagColor: '#10b981'
    },
    {
        gradientId: 'gradient-purple',
        glowColor: 'rgba(139, 92, 246, 0.15)',
        glowStrong: 'rgba(139, 92, 246, 0.45)',
        tagColor: '#8b5cf6'
    },
    {
        gradientId: 'gradient-teal',
        glowColor: 'rgba(13, 148, 136, 0.15)',
        glowStrong: 'rgba(13, 148, 136, 0.45)',
        tagColor: '#0d9488'
    },
    {
        gradientId: 'gradient-red',
        glowColor: 'rgba(239, 68, 68, 0.15)',
        glowStrong: 'rgba(239, 68, 68, 0.45)',
        tagColor: '#ef4444'
    },
    {
        gradientId: 'gradient-indigo',
        glowColor: 'rgba(99, 102, 241, 0.15)',
        glowStrong: 'rgba(99, 102, 241, 0.45)',
        tagColor: '#6366f1'
    },
    {
        gradientId: 'gradient-amber',
        glowColor: 'rgba(217, 119, 6, 0.15)',
        glowStrong: 'rgba(217, 119, 6, 0.45)',
        tagColor: '#d97706'
    },
    {
        gradientId: 'gradient-rose',
        glowColor: 'rgba(244, 63, 94, 0.15)',
        glowStrong: 'rgba(244, 63, 94, 0.45)',
        tagColor: '#f43f5e'
    }
];

function createIllustratedAvatar({ bgStart, bgEnd, skin, hair, shirt, accent, eye = '#2d3748' }) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${bgStart}" />
                    <stop offset="100%" stop-color="${bgEnd}" />
                </linearGradient>
                <linearGradient id="shirt" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${shirt}" />
                    <stop offset="100%" stop-color="${accent}" />
                </linearGradient>
            </defs>
            <rect width="160" height="160" rx="80" fill="url(#bg)" />
            <circle cx="80" cy="74" r="34" fill="${skin}" />
            <path d="M46 61c4-26 21-40 44-40 23 0 39 13 43 37-7-7-17-11-28-11-11 0-21 4-29 9-9 6-18 10-30 5z" fill="${hair}" />
            <path d="M54 106c7 10 16 16 26 16 11 0 21-6 27-16l9 7c-8 16-21 25-36 25-15 0-28-8-37-24z" fill="url(#shirt)" />
            <circle cx="67" cy="76" r="4.2" fill="${eye}" />
            <circle cx="95" cy="76" r="4.2" fill="${eye}" />
            <path d="M69 94c6 6 16 6 22 0" fill="none" stroke="#c05e63" stroke-width="4" stroke-linecap="round" />
            <circle cx="55" cy="88" r="6" fill="#f5a0a8" opacity="0.45" />
            <circle cx="105" cy="88" r="6" fill="#f5a0a8" opacity="0.45" />
            <path d="M43 150c8-22 21-34 38-34 17 0 31 12 38 34" fill="url(#shirt)" opacity="0.95" />
            <circle cx="121" cy="35" r="10" fill="${accent}" opacity="0.55" />
            <circle cx="42" cy="43" r="8" fill="#ffffff" opacity="0.16" />
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 預設兒童資料 (初次載入 3 人，可調整至 2~10 人)
const DEFAULT_KIDS = [
    {
        id: 'kid-1',
        name: '橘子',
        emoji: '🍊',
        avatarUrl: createIllustratedAvatar({
            bgStart: '#ffe5c0',
            bgEnd: '#ff9f6b',
            skin: '#ffd5b2',
            hair: '#2f221d',
            shirt: '#7dd3fc',
            accent: '#38bdf8'
        }),
        avatarGallery: [],
        score: 0,
        ...THEME_CONFIGS[0]
    },
    {
        id: 'kid-2',
        name: '柚子',
        emoji: '🍈',
        avatarUrl: createIllustratedAvatar({
            bgStart: '#ffd5ec',
            bgEnd: '#ff91bf',
            skin: '#ffd8bf',
            hair: '#3a241b',
            shirt: '#c084fc',
            accent: '#f472b6'
        }),
        avatarGallery: [],
        score: 1,
        ...THEME_CONFIGS[1]
    },
    {
        id: 'kid-3',
        name: '蘋果',
        emoji: '🍎',
        avatarUrl: createIllustratedAvatar({
            bgStart: '#d9efff',
            bgEnd: '#7fb9ff',
            skin: '#ffd7bc',
            hair: '#2a1d1b',
            shirt: '#60a5fa',
            accent: '#2563eb'
        }),
        avatarGallery: [],
        score: 5,
        ...THEME_CONFIGS[2]
    }
];

const DEFAULT_HISTORY = [
    {
        kidId: 'kid-2',
        name: '柚子',
        typeText: '加 1 分',
        scoreChange: 1,
        reason: '打掃房間',
        time: '08:31:58',
        tagColor: '#ec4899'
    },
    {
        kidId: 'kid-3',
        name: '蘋果',
        typeText: '加 5 分',
        scoreChange: 5,
        reason: '主動完成閱讀與收玩具',
        time: '08:31:38',
        tagColor: '#3b82f6'
    }
];

// SVG 圓圈半徑與周長 (r=70, C=2*pi*r ≈ 439.82)
const RING_CIRCUMFERENCE = 439.82;

// 應用程式狀態 (State)
let state = {
    kids: [],
    history: [],
    presets: [],
    editingKidId: null,
    selectedEmoji: '',
    title: '兒童表現計分板',
    subtitle: '記錄兒童的日常表現，累積100分拿大獎！'
};
let lastServerRevision = null;
let syncPollTimer = null;
let pendingRemoteState = null;

function getDefaultState() {
    return {
        kids: JSON.parse(JSON.stringify(DEFAULT_KIDS)),
        history: JSON.parse(JSON.stringify(DEFAULT_HISTORY)),
        presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)),
        title: '兒童表現計分板',
        subtitle: '記錄兒童的日常表現，累積100分拿大獎！'
    };
}

function normalizePresets(loadedPresets = []) {
    if (!Array.isArray(loadedPresets) || loadedPresets.length < 9) {
        const presets = Array.isArray(loadedPresets) ? [...loadedPresets] : [];
        while (presets.length < 9) {
            const fallback = DEFAULT_PRESETS[presets.length] || DEFAULT_PRESETS[0];
            presets.push(JSON.parse(JSON.stringify(fallback)));
        }
        return presets.slice(0, 9);
    }
    return loadedPresets.slice(0, 9).map(p => ({
        icon: p.icon || '⭐',
        label: p.label || '事件',
        val: typeof p.val === 'number' ? p.val : 1
    }));
}

function dedupeAvatarGallery(photos = []) {
    return [...new Set(photos.filter(Boolean))].slice(0, MAX_AVATAR_UPLOADS);
}

function isUploadedPhotoDataUrl(photo = '') {
    return typeof photo === 'string' && photo.startsWith('data:image/jpeg');
}

function normalizeKids(loadedKids = []) {
    if (!Array.isArray(loadedKids) || loadedKids.length === 0) {
        return JSON.parse(JSON.stringify(DEFAULT_KIDS));
    }

    let kids = loadedKids.slice(0, 10);
    if (kids.length < 2) {
        while (kids.length < 2) {
            const index = kids.length;
            const fallback = DEFAULT_KIDS[index] || DEFAULT_KIDS[0];
            kids.push(JSON.parse(JSON.stringify(fallback)));
        }
    }

    return kids.map((kid, index) => {
        const theme = THEME_CONFIGS[index % THEME_CONFIGS.length];
        const avatarGallery = dedupeAvatarGallery([
            ...(Array.isArray(kid.avatarGallery) ? kid.avatarGallery : []),
            isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : ''
        ]);

        return {
            id: kid.id || `kid-${Date.now()}-${index}`,
            name: kid.name || `成員 ${index + 1}`,
            emoji: kid.emoji || '👶',
            avatarUrl: kid.avatarUrl || createIllustratedAvatar({
                bgStart: '#ffe5c0',
                bgEnd: '#ff9f6b',
                skin: '#ffd5b2',
                hair: '#2f221d',
                shirt: '#7dd3fc',
                accent: '#38bdf8'
            }),
            avatarGallery,
            score: typeof kid.score === 'number' ? kid.score : 0,
            prizeCount: typeof kid.prizeCount === 'number' ? kid.prizeCount : 0,
            gradientId: theme.gradientId,
            glowColor: theme.glowColor,
            glowStrong: theme.glowStrong,
            tagColor: theme.tagColor
        };
    });
}

function extractRevision(payload) {
    return payload?.meta?.revision || null;
}

function applyLoadedState(sourceData) {
    state.kids = normalizeKids(sourceData.kids || []);
    state.history = sourceData.history || [];
    state.presets = normalizePresets(sourceData.presets || []);
    state.title = sourceData.title || getDefaultState().title;
    state.subtitle = sourceData.subtitle || getDefaultState().subtitle;
    lastServerRevision = extractRevision(sourceData) || lastServerRevision;
}

function renderAllState() {
    renderScoreboardHeader();
    renderAllCards();
    renderHistory();
}

function hasOpenModal() {
    return Boolean(document.querySelector('.modal-overlay.show'));
}

function applyPendingRemoteState() {
    if (!pendingRemoteState || hasOpenModal()) return;
    applyLoadedState(pendingRemoteState);
    saveToLocalStorage();
    renderAllState();
    updateSyncStatus('online', '已同步其他裝置的最新變更');
    pendingRemoteState = null;
}

async function fetchRemoteState({ silent = false } = {}) {
    try {
        const response = await fetch(`api.php?_=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) return null;
        const serverData = await response.json();
        if (!serverData) {
            return null;
        }
        return serverData;
    } catch (error) {
        if (!silent) {
            console.warn('抓取 NAS 最新資料失敗。', error);
        }
        return null;
    }
}

async function pollRemoteUpdates() {
    const serverData = await fetchRemoteState({ silent: true });
    if (!serverData || serverData.status === 'empty' || !Array.isArray(serverData.kids)) return;

    const incomingRevision = extractRevision(serverData);
    if (!incomingRevision || incomingRevision === lastServerRevision) {
        return;
    }

    if (hasOpenModal()) {
        pendingRemoteState = serverData;
        updateSyncStatus('online', '偵測到其他裝置更新，關閉視窗後會自動套用');
        return;
    }

    applyLoadedState(serverData);
    saveToLocalStorage();
    renderAllState();
    updateSyncStatus('online', '已同步其他裝置的最新變更');
}

function startRealtimeSync() {
    if (syncPollTimer) {
        clearInterval(syncPollTimer);
    }
    syncPollTimer = setInterval(() => {
        pollRemoteUpdates();
    }, SYNC_POLL_INTERVAL_MS);
}

/* ==========================================================================
   LocalStorage 資料讀寫
   ========================================================================== */

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
        localStorage.setItem('kids_multi_scoreboard_data', JSON.stringify(state.kids));
        localStorage.setItem('kids_multi_scoreboard_history', JSON.stringify(state.history));
        localStorage.setItem('kids_multi_scoreboard_presets', JSON.stringify(state.presets));
        localStorage.setItem('kids_multi_scoreboard_title', state.title);
        localStorage.setItem('kids_multi_scoreboard_subtitle', state.subtitle);
    } catch (e) {
        console.error('儲存至 LocalStorage 失敗。', e);
    }
}

/* 顯示與更新 UI 同步指示燈 */
function updateSyncStatus(status, message = '') {
    const pill = document.getElementById('sync-status');
    if (!pill) return;

    const dot = pill.querySelector('.sync-dot');
    const text = pill.querySelector('.sync-text');

    pill.className = 'sync-status-pill';

    if (status === 'online') {
        pill.classList.add('online');
        if (text) text.textContent = '已同步 NAS';
        pill.title = message || '資料已成功儲存於您的 Synology NAS';
    } else if (status === 'offline') {
        pill.classList.add('offline');
        if (text) text.textContent = '本機模式 (離線)';
        pill.title = message || '目前無法連接 NAS，資料暫存於此瀏覽器中 (LocalStorage)';
    } else if (status === 'error') {
        pill.classList.add('error');
        if (text) text.textContent = '同步失敗';
        pill.title = message || 'NAS 資料寫入失敗！請檢查資料夾寫入權限';
    } else if (status === 'loading') {
        pill.classList.add('loading');
        if (text) text.textContent = '同步中...';
        pill.title = message || '正在嘗試與 NAS 同步中...';
    }
}

async function loadState() {
    updateSyncStatus('loading', '正在連線 NAS 載入線上數據...');
    
    // 1. 優先嘗試向 NAS 後端讀取資料
    try {
        const serverData = await fetchRemoteState();
        if (serverData) {
            if (serverData && serverData.kids && serverData.kids.length > 0) {
                applyLoadedState(serverData);
                saveToLocalStorage();
                updateSyncStatus('online', '已成功載入 Synology NAS 線上計分數據');
                return;
            } else if (serverData && serverData.status === 'empty') {
                // NAS 上無檔案，進行首次存檔初始化
                const defaults = getDefaultState();
                state.kids = defaults.kids;
                state.history = defaults.history;
                state.title = defaults.title;
                state.subtitle = defaults.subtitle;
                await saveState();
                updateSyncStatus('online', '已成功連線 NAS 並初始化計分數據');
                return;
            }
        }
        updateSyncStatus('offline', 'NAS 回傳無效狀態，已自動降級使用本機 LocalStorage');
    } catch (e) {
        console.warn('無法從 NAS api.php 載入資料，將降級使用本機 LocalStorage。', e);
        updateSyncStatus('offline', '連線 NAS 失敗，已自動降級為本機模式 (資料保存在此瀏覽器)');
    }

    // 2. 降級方案：從本機 LocalStorage 載入資料
    try {
        const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
        const savedKids = localStorage.getItem('kids_multi_scoreboard_data');
        const savedHistory = localStorage.getItem('kids_multi_scoreboard_history');
        const savedPresets = localStorage.getItem('kids_multi_scoreboard_presets');
        const savedTitle = localStorage.getItem('kids_multi_scoreboard_title');
        const savedSubtitle = localStorage.getItem('kids_multi_scoreboard_subtitle');

        if (!savedKids && !savedHistory && !savedTitle && !savedSubtitle) {
            const defaults = getDefaultState();
            state.kids = defaults.kids;
            state.history = defaults.history;
            state.presets = defaults.presets;
            state.title = defaults.title;
            state.subtitle = defaults.subtitle;
            saveToLocalStorage();
            return;
        }

        if (savedKids) {
            state.kids = normalizeKids(JSON.parse(savedKids));
        } else {
            state.kids = getDefaultState().kids;
        }

        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        } else {
            state.history = getDefaultState().history;
        }

        if (savedPresets) {
            state.presets = normalizePresets(JSON.parse(savedPresets));
        } else {
            state.presets = normalizePresets([]);
        }

        if (savedTitle) {
            state.title = savedTitle;
        } else {
            state.title = getDefaultState().title;
        }

        if (savedSubtitle) {
            state.subtitle = savedSubtitle;
        } else {
            state.subtitle = getDefaultState().subtitle;
        }

        if (savedVersion !== STORAGE_VERSION) {
            saveToLocalStorage();
        }
    } catch (e) {
        console.error('讀取 LocalStorage 失敗，使用預設值。', e);
        const defaults = getDefaultState();
        state.kids = defaults.kids;
        state.history = defaults.history;
        state.title = defaults.title;
        state.subtitle = defaults.subtitle;
    }
}

async function saveState() {
    saveToLocalStorage();
    updateSyncStatus('loading', '正在儲存資料至 NAS...');

    try {
        const payload = {
            kids: state.kids,
            history: state.history,
            presets: state.presets,
            title: state.title,
            subtitle: state.subtitle
        };
        const res = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const result = await res.json();
            if (result.success) {
                lastServerRevision = result.meta?.revision || lastServerRevision;
                updateSyncStatus('online', '資料已成功儲存於您的 Synology NAS');
            } else {
                updateSyncStatus('error', 'NAS 寫入權限錯誤：' + (result.message || '檔案寫入失敗'));
                console.error('NAS 後端錯誤：', result.message);
            }
        } else {
            updateSyncStatus('error', 'NAS 連線回應錯誤 (HTTP ' + res.status + ')');
        }
    } catch (e) {
        console.error('資料同步至 NAS 失敗。', e);
        updateSyncStatus('offline', '連線 NAS 失敗，資料已暫存於本機 (LocalStorage)');
    }
}

/* ==========================================================================
   時間格式化工具
   ========================================================================== */

function getFormattedTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/* ==========================================================================
   滿分慶祝效果 (Canvas Confetti)
   ========================================================================== */

function triggerCelebration() {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

/* ==========================================================================
   動態 DOM 生成與渲染
   ========================================================================== */

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const max_size = 180;
            let width = img.width;
            let height = img.height;
            
            const size = Math.min(width, height);
            canvas.width = max_size;
            canvas.height = max_size;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                img,
                (width - size) / 2, (height - size) / 2, size, size,
                0, 0, max_size, max_size
            );
            
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            callback(base64);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 建立單個兒童計分板卡片 HTML
function createKidCardHTML(kid) {
    const RING_CIRCUMFERENCE_100 = 263.89;
    const offset = RING_CIRCUMFERENCE_100 - (kid.score / 100) * RING_CIRCUMFERENCE_100;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const milestoneVal = i * 20;
        const activeClass = kid.score >= milestoneVal ? 'active' : '';
        starsHTML += `
            <svg class="star-icon ${activeClass}" data-index="${i}" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        `;
    }

    let presetsHTML = '';
    state.presets.forEach(preset => {
        const valText = preset.val >= 0 ? `+${preset.val}` : `${preset.val}`;
        presetsHTML += `
            <button class="quick-btn" onclick="quickScore('${kid.id}', '${preset.label}', ${preset.val})" title="${preset.label} ${valText}">
                <span class="quick-btn-icon">${preset.icon}</span>
                <span class="quick-btn-label">${preset.label}</span>
                <span class="quick-btn-val">${valText}</span>
            </button>
        `;
    });

    const prizeBadgeHTML = kid.prizeCount > 0 
        ? `<span class="kid-prize-badge" title="累計獲得獎品 ${kid.prizeCount} 次">🎁 x${kid.prizeCount}</span>` 
        : '';

    let redeemBtnHTML = '';
    if (kid.score === 100) {
        redeemBtnHTML = `
            <div class="redeem-btn-container">
                <button class="btn-redeem" onclick="redeemPrize('${kid.id}')" title="點擊兌換獎品並重設為 0 分">
                    🎉 點我兌換大獎 🎁
                </button>
            </div>
        `;
    }

    return `
        <article class="kid-card glass-panel" id="card-${kid.id}" style="--theme-color: ${kid.tagColor};">
            <!-- 編輯按鈕 (三個點) -->
            <button class="btn-edit-profile" onclick="openEditModal('${kid.id}')" title="修改大頭貼與名字">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
            
            <!-- 卡片頭部 (Emoji + 姓名) -->
            <div class="kid-card-header">
                <div class="kid-title-container">
                    <span class="kid-fruit-emoji">${kid.emoji}</span>
                    <h2 class="kid-name">${kid.name}</h2>
                    ${prizeBadgeHTML}
                </div>
            </div>
            
            <!-- 左右並排的儀表板 -->
            <div class="kid-card-body-row">
                <!-- 左側：大頭照 + 勳章 -->
                <div class="avatar-container" onclick="openEditModal('${kid.id}')">
                    <div class="avatar-image-wrapper">
                        ${kid.avatarUrl ? `<img src="${kid.avatarUrl}" class="avatar-img" alt="${kid.name}">` : `<span class="avatar-emoji">${kid.emoji}</span>`}
                    </div>
                    <!-- 勳章 -->
                    <div class="medal-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    </div>
                </div>

                <!-- 右側：環形進度條與分數 -->
                <div class="score-circle-wrapper">
                    <svg class="score-svg-ring" width="100" height="100" viewBox="0 0 100 100">
                        <circle class="score-svg-bg" cx="50" cy="50" r="42"></circle>
                        <circle class="score-svg-progress" cx="50" cy="50" r="42" 
                                stroke="url(#${kid.gradientId})" 
                                stroke-dasharray="263.89" 
                                stroke-dashoffset="${offset}"></circle>
                    </svg>
                    <div class="score-display">
                        <span class="score-number">${kid.score}</span>
                        <span class="score-unit">分</span>
                    </div>
                </div>
            </div>

            <!-- 星星里程碑 -->
            <div class="milestones-stars" title="每 20 分獲得一顆星星！">
                ${starsHTML}
            </div>

            ${redeemBtnHTML}

            <!-- 常用原因與點數 -->
            <div class="quick-actions-container">
                <div class="quick-actions-header">
                    <span class="quick-actions-title">常用原因與點數</span>
                    <button class="btn-edit-presets" onclick="openPresetsModal()" title="修改常用原因與點數">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>設定</span>
                    </button>
                </div>
                <div class="quick-actions-grid">
                    ${presetsHTML}
                </div>
            </div>

            <!-- 控制按鈕 -->
            <div class="controls-container">
                <button class="btn-ctrl btn-minus" onclick="changeScore('${kid.id}', -1)" title="扣 1 分">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>
                </button>
                <button class="btn-ctrl btn-plus" onclick="changeScore('${kid.id}', 1)" title="加 1 分">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
            </div>
        </article>
    `;
}

// 渲染全部卡片
function renderAllCards() {
    const container = document.getElementById('scoreboard-container');
    if (!container) return;
    
    if (state.kids.length === 0) {
        container.innerHTML = '<div class="card-loading">目前無成員。請點擊「管理成員」來新增。</div>';
        return;
    }
    
    let html = '';
    state.kids.forEach(kid => {
        html += createKidCardHTML(kid);
    });
    
    container.innerHTML = html;
}

// 局部更新單個兒童卡片
function updateCardDOM(kid) {
    const cardEl = document.getElementById(`card-${kid.id}`);
    if (!cardEl) return;
    
    const scoreNumEl = cardEl.querySelector('.score-number');
    if (scoreNumEl) {
        const oldScore = parseInt(scoreNumEl.textContent);
        if (oldScore !== kid.score) {
            scoreNumEl.textContent = kid.score;
            scoreNumEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreNumEl.style.transform = 'scale(1)';
            }, 150);
        }
    }
    
    const progressEl = cardEl.querySelector('.score-svg-progress');
    if (progressEl) {
        const offset = 263.89 - (kid.score / 100) * 263.89;
        progressEl.style.strokeDashoffset = offset;
    }
    
    const starIcons = cardEl.querySelectorAll('.star-icon');
    starIcons.forEach((star, idx) => {
        const milestoneVal = (idx + 1) * 20;
        if (kid.score >= milestoneVal) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    const avatarWrapper = cardEl.querySelector('.avatar-image-wrapper');
    if (avatarWrapper) {
        if (kid.avatarUrl) {
            avatarWrapper.innerHTML = `<img src="${kid.avatarUrl}" class="avatar-img" alt="${kid.name}">`;
        } else {
            avatarWrapper.innerHTML = `<span class="avatar-emoji">${kid.emoji}</span>`;
        }
    }
    
    const titleContainer = cardEl.querySelector('.kid-title-container');
    if (titleContainer) {
        const prizeBadgeHTML = kid.prizeCount > 0 
            ? `<span class="kid-prize-badge" title="累計獲得獎品 ${kid.prizeCount} 次">🎁 x${kid.prizeCount}</span>` 
            : '';
        titleContainer.innerHTML = `
            <span class="kid-fruit-emoji">${kid.emoji}</span>
            <h2 class="kid-name">${kid.name}</h2>
            ${prizeBadgeHTML}
        `;
    }

    // 動態更新兌換按鈕顯示狀態
    let redeemContainer = cardEl.querySelector('.redeem-btn-container');
    if (kid.score === 100) {
        if (!redeemContainer) {
            const starsEl = cardEl.querySelector('.milestones-stars');
            if (starsEl) {
                const newRedeem = document.createElement('div');
                newRedeem.className = 'redeem-btn-container';
                newRedeem.innerHTML = `
                    <button class="btn-redeem" onclick="redeemPrize('${kid.id}')" title="點擊兌換獎品並重設為 0 分">
                        🎉 點我兌換大獎 🎁
                    </button>
                `;
                starsEl.after(newRedeem);
            }
        }
    } else {
        if (redeemContainer) {
            redeemContainer.remove();
        }
    }
}

/* ==========================================================================
   歷史紀錄 Log 功能
   ========================================================================== */

function addLog(kidId, name, scoreChange, reason, kidTagColor) {
    const time = getFormattedTime();
    const typeText = scoreChange > 0 ? `加 ${scoreChange} 分` : (scoreChange < 0 ? `減 ${Math.abs(scoreChange)} 分` : '變更');
    
    const newLog = {
        kidId,
        name,
        typeText,
        scoreChange,
        reason: reason.trim() || (scoreChange > 0 ? '表現良好！' : (scoreChange < 0 ? '仍需加油！' : '修改資料')),
        time,
        tagColor: kidTagColor
    };
    
    state.history.unshift(newLog);
    
    if (state.history.length > 50) {
        state.history.pop();
    }
    
    saveState();
    renderHistory();
}

function renderHistory() {
    const listEl = document.getElementById('history-log-list');
    if (!listEl) return;
    
    if (state.history.length === 0) {
        listEl.innerHTML = '<li class="history-empty">目前尚無任何紀錄，開始為寶貝加分吧！</li>';
        return;
    }
    
    let html = '';
    state.history.forEach(log => {
        const kid = state.kids.find(k => k.id === log.kidId);
        const avatarHTML = kid 
            ? (kid.avatarUrl ? `<img src="${kid.avatarUrl}" class="history-avatar-img" alt="${log.name}">` : `<span class="history-avatar-emoji">${kid.emoji}</span>`)
            : '👶';
            
        const borderStyle = log.tagColor ? `background-color: ${log.tagColor}; color: #ffffff;` : 'background-color: var(--btn-secondary); color: var(--text-primary);';
        
        let scoreStyle = 'color: #94a3b8; font-weight: bold;';
        if (log.scoreChange > 0) {
            scoreStyle = 'color: #10b981; font-weight: bold;';
        } else if (log.scoreChange < 0) {
            scoreStyle = 'color: #f43f5e; font-weight: bold;';
        }
        
        html += `
            <li class="history-item">
                <div class="history-item-content">
                    <div class="history-avatar-container">
                        ${avatarHTML}
                    </div>
                    <span class="history-kid-tag" style="${borderStyle}">${log.name}</span>
                    <span class="history-item-text">
                        得到 <span style="${scoreStyle}">${log.typeText}</span>
                    </span>
                    <span class="history-item-reason">(${log.reason})</span>
                </div>
                <div class="history-time-container">
                    <span class="history-item-time">${log.time}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock history-clock-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
            </li>
        `;
    });
    
    listEl.innerHTML = html;
}

/* ==========================================================================
   互動邏輯：分數操作
   ========================================================================== */

window.changeScore = function(kidId, amount, reason = '') {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    const prevScore = kid.score;
    let newScore = prevScore + amount;
    
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;
    
    if (newScore === prevScore) return;
    
    kid.score = newScore;
    
    addLog(kid.id, kid.name, amount, reason, kid.tagColor);
    updateCardDOM(kid);
    saveState();
    
    if (newScore === 100 && prevScore < 100) {
        triggerCelebration();
        setTimeout(() => {
            addLog(kid.id, kid.name, 0, '恭喜達到 100 分滿分！🎉🏆 太棒了！', '#d97706');
        }, 300);
    }
};

window.quickScore = function(kidId, reason, amount) {
    window.changeScore(kidId, amount, reason);
};

/* ==========================================================================
   編輯寶貝 Modal 功能
   ========================================================================== */

const editModalEl = document.getElementById('modal-edit-profile');
const editNameInput = document.getElementById('edit-name');
const emojiGridEl = document.getElementById('emoji-grid');
const uploadGalleryEl = document.getElementById('upload-gallery');
let uploadedAvatarBase64 = '';
let uploadedAvatarHistory = [];

window.openEditModal = function(kidId) {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    state.editingKidId = kidId;
    state.selectedEmoji = kid.emoji;
    editNameInput.value = kid.name;
    
    const prizeCountInput = document.getElementById('edit-prize-count');
    if (prizeCountInput) {
        prizeCountInput.value = kid.prizeCount || 0;
    }
    
    uploadedAvatarBase64 = isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : '';
    uploadedAvatarHistory = dedupeAvatarGallery([
        ...(Array.isArray(kid.avatarGallery) ? kid.avatarGallery : []),
        isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : ''
    ]);
    
    const fileInput = document.getElementById('edit-avatar-file');
    if (fileInput) fileInput.value = '';
    
    updateUploadPreview();
    renderEmojiGrid();
    
    editModalEl.classList.add('show');
};

function closeEditModal() {
    editModalEl.classList.remove('show');
    state.editingKidId = null;
    applyPendingRemoteState();
}

function updateUploadPreview() {
    const previewEl = document.getElementById('upload-preview');
    const statusEl = document.getElementById('upload-preview-status');
    const removeBtn = document.getElementById('btn-remove-uploaded');
    
    if (!previewEl || !statusEl || !removeBtn) return;
    
    if (uploadedAvatarBase64) {
        previewEl.innerHTML = `<img src="${uploadedAvatarBase64}" alt="頭像預覽">`;
        statusEl.textContent = `已保留 ${uploadedAvatarHistory.length} / ${MAX_AVATAR_UPLOADS} 張照片`;
        removeBtn.style.display = 'inline-block';
    } else {
        previewEl.innerHTML = '📷';
        statusEl.textContent = uploadedAvatarHistory.length > 0 ? `已保留 ${uploadedAvatarHistory.length} / ${MAX_AVATAR_UPLOADS} 張照片` : '尚未上傳自訂圖片';
        removeBtn.style.display = 'none';
    }

    renderUploadGallery();
}

function renderUploadGallery() {
    if (!uploadGalleryEl) return;

    if (uploadedAvatarHistory.length === 0) {
        uploadGalleryEl.innerHTML = '<div class="upload-gallery-empty">尚未保留任何照片</div>';
        return;
    }

    uploadGalleryEl.innerHTML = uploadedAvatarHistory.map((photo, index) => {
        const activeClass = photo === uploadedAvatarBase64 ? 'active' : '';
        return `
            <button
                type="button"
                class="upload-gallery-item ${activeClass}"
                onclick="selectUploadedPhoto(${index})"
                title="切換到第 ${index + 1} 張照片">
                <img src="${photo}" alt="保留照片 ${index + 1}">
            </button>
        `;
    }).join('');
}

document.getElementById('btn-upload-trigger')?.addEventListener('click', () => {
    document.getElementById('edit-avatar-file')?.click();
});

document.getElementById('edit-avatar-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';

    compressImage(file, (base64) => {
        uploadedAvatarBase64 = base64;
        uploadedAvatarHistory = dedupeAvatarGallery([
            base64,
            ...uploadedAvatarHistory.filter(photo => photo !== base64)
        ]);
        updateUploadPreview();
    });
});

document.getElementById('btn-remove-uploaded')?.addEventListener('click', () => {
    uploadedAvatarHistory = uploadedAvatarHistory.filter(photo => photo !== uploadedAvatarBase64);
    uploadedAvatarBase64 = uploadedAvatarHistory[0] || '';
    const fileInput = document.getElementById('edit-avatar-file');
    if (fileInput) fileInput.value = '';
    updateUploadPreview();
});

window.selectUploadedPhoto = function(photoIndex) {
    const selectedPhoto = uploadedAvatarHistory[photoIndex];
    if (!selectedPhoto) return;
    uploadedAvatarBase64 = selectedPhoto;
    updateUploadPreview();
};

function renderEmojiGrid() {
    if (!emojiGridEl) return;
    
    let html = '';
    CURED_EMOJIS.forEach(emoji => {
        const isSelected = emoji === state.selectedEmoji ? 'selected' : '';
        html += `
            <div class="emoji-option ${isSelected}" onclick="selectEmoji(this, '${emoji}')">
                ${emoji}
            </div>
        `;
    });
    
    emojiGridEl.innerHTML = html;
}

window.selectEmoji = function(element, emoji) {
    const selected = emojiGridEl.querySelector('.emoji-option.selected');
    if (selected) {
        selected.classList.remove('selected');
    }
    
    element.classList.add('selected');
    state.selectedEmoji = emoji;
};

// 儲存修改
document.getElementById('btn-modal-save')?.addEventListener('click', () => {
    if (!state.editingKidId) return;
    
    const kid = state.kids.find(k => k.id === state.editingKidId);
    const newName = editNameInput.value.trim();
    
    if (!newName) {
        alert('請輸入姓名！');
        return;
    }
    
    const oldName = kid.name;
    const oldEmoji = kid.emoji;
    const oldAvatar = kid.avatarUrl || '';
    const nextAvatarGallery = dedupeAvatarGallery(uploadedAvatarHistory);
    const resolvedAvatarUrl = uploadedAvatarBase64 || (!isUploadedPhotoDataUrl(oldAvatar) ? oldAvatar : '');
    
    kid.name = newName;
    kid.emoji = state.selectedEmoji;
    kid.avatarUrl = resolvedAvatarUrl;
    kid.avatarGallery = nextAvatarGallery;
    
    const prizeCountInput = document.getElementById('edit-prize-count');
    if (prizeCountInput) {
        kid.prizeCount = Math.max(0, parseInt(prizeCountInput.value) || 0);
    }
    
    if (oldName !== newName || oldEmoji !== state.selectedEmoji || oldAvatar !== resolvedAvatarUrl) {
        let changeDesc = `變更資料：`;
        if (oldName !== newName) changeDesc += `名字由 ${oldName} 改為 ${newName}。`;
        if (oldAvatar !== resolvedAvatarUrl) {
            changeDesc += resolvedAvatarUrl && isUploadedPhotoDataUrl(resolvedAvatarUrl) ? `上傳了自訂大頭照。` : `移除了自訂大頭照。`;
        } else if (oldEmoji !== state.selectedEmoji) {
            changeDesc += `頭像改為 ${state.selectedEmoji}。`;
        }
        
        addLog(
            kid.id, 
            newName, 
            0, 
            changeDesc, 
            kid.tagColor
        );
    }
    
    renderAllCards();
    saveState();
    closeEditModal();
});

document.getElementById('btn-modal-close')?.addEventListener('click', closeEditModal);
document.getElementById('btn-modal-cancel')?.addEventListener('click', closeEditModal);

editModalEl?.addEventListener('click', (e) => {
    if (e.target === editModalEl) {
        closeEditModal();
    }
});

// 重設單個兒童分數為 0
document.getElementById('btn-reset-single-score')?.addEventListener('click', () => {
    if (!state.editingKidId) return;
    const kid = state.kids.find(k => k.id === state.editingKidId);
    if (!kid) return;
    if (confirm(`確認要將「${kid.name}」的分數重設為 0 嗎？\n(此動作僅重設計分板分數，不影響累計獎品次數)`)) {
        kid.score = 0;
        addLog(kid.id, kid.name, 0, '手動重設分數為 0 分。', kid.tagColor);
        renderAllCards();
        saveState();
        closeEditModal();
    }
});

// 兌換獎品並歸零分數
window.redeemPrize = function(kidId) {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    if (confirm(`確認要為「${kid.name}」兌換獎品嗎？\n這會將分數重設為 0 分，且累計增加 1 次獎品次數！`)) {
        kid.score = 0;
        kid.prizeCount = (kid.prizeCount || 0) + 1;
        
        addLog(kid.id, kid.name, 0, `兌換了滿分大獎！🎁 累計獲得 ${kid.prizeCount} 次獎品！🏆`, kid.tagColor);
        triggerCelebration();
        renderAllCards();
        saveState();
    }
};

/* ==========================================================================
   成員管理 Modal 功能 (新增/刪除，最少2人，最多10人)
   ========================================================================== */

const manageModalEl = document.getElementById('modal-manage-kids');
const manageKidsListEl = document.getElementById('manage-kids-list');
const btnAddKidEl = document.getElementById('btn-add-kid');

window.openManageModal = function() {
    renderManageKidsList();
    manageModalEl.classList.add('show');
};

function closeManageModal() {
    manageModalEl.classList.remove('show');
    applyPendingRemoteState();
}

function renderManageKidsList() {
    if (!manageKidsListEl) return;
    
    const count = state.kids.length;
    let html = '';
    
    state.kids.forEach((kid, idx) => {
        const avatarHTML = kid.avatarUrl 
            ? `<img src="${kid.avatarUrl}" alt="${kid.name}">` 
            : `<span class="emoji">${kid.emoji}</span>`;
            
        const isDeleteDisabled = count <= 2 ? 'disabled' : '';
        
        html += `
            <div class="manage-kid-row">
                <div class="manage-kid-info">
                    <div class="manage-kid-avatar">
                        ${avatarHTML}
                    </div>
                    <span class="manage-kid-name">${kid.name} ${kid.emoji}</span>
                </div>
                <button class="btn-delete-kid" ${isDeleteDisabled} onclick="deleteKid('${kid.id}')" title="刪除此成員">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    <span>刪除</span>
                </button>
            </div>
        `;
    });
    
    manageKidsListEl.innerHTML = html;
    
    if (count >= 10) {
        btnAddKidEl.disabled = true;
        btnAddKidEl.style.opacity = '0.5';
        btnAddKidEl.style.cursor = 'not-allowed';
        btnAddKidEl.querySelector('span').textContent = '成員已達上限 (10人)';
    } else {
        btnAddKidEl.disabled = false;
        btnAddKidEl.style.opacity = '1';
        btnAddKidEl.style.cursor = 'pointer';
        btnAddKidEl.querySelector('span').textContent = '新增成員';
    }
}

const deleteConfirmModalEl = document.getElementById('modal-delete-confirm');
const deleteConfirmNameEl = document.getElementById('delete-confirm-name');
let kidIdToDelete = null;

window.deleteKid = function(kidId) {
    if (state.kids.length <= 2) {
        alert('最少需要保留 2 位成員！');
        return;
    }
    
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    kidIdToDelete = kidId;
    if (deleteConfirmNameEl) {
        deleteConfirmNameEl.textContent = `${kid.name} ${kid.emoji}`;
    }
    deleteConfirmModalEl.classList.add('show');
};

function closeDeleteConfirmModal() {
    deleteConfirmModalEl.classList.remove('show');
    kidIdToDelete = null;
    applyPendingRemoteState();
}

document.getElementById('btn-delete-close')?.addEventListener('click', closeDeleteConfirmModal);
document.getElementById('btn-delete-cancel')?.addEventListener('click', closeDeleteConfirmModal);
deleteConfirmModalEl?.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModalEl) {
        closeDeleteConfirmModal();
    }
});

document.getElementById('btn-delete-confirm')?.addEventListener('click', () => {
    if (!kidIdToDelete) return;
    
    const kid = state.kids.find(k => k.id === kidIdToDelete);
    if (kid) {
        addLog(
            kid.id,
            kid.name,
            0,
            `移除了成員：${kid.name}。`,
            kid.tagColor
        );
        
        state.kids = state.kids.filter(k => k.id !== kidIdToDelete);
        state.kids = normalizeKids(state.kids);
        
        renderAllCards();
        renderManageKidsList();
        saveState();
    }
    
    closeDeleteConfirmModal();
});

window.addNewKid = function() {
    if (state.kids.length >= 10) {
        alert('最多只能新增 10 位成員！');
        return;
    }
    
    const currentCount = state.kids.length;
    const theme = THEME_CONFIGS[currentCount % THEME_CONFIGS.length];
    
    const randomEmojis = ['👶', '👧', '👦', '🐱', '🐶', '🦄', '🦖', '🦁', '🐼', '🦊', '🐯', '🐰', '🐨', '🐷', '🐸', '🚀', '⭐', '🌈', '🎨', '⚽'];
    const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
    const newName = `成員 ${currentCount + 1}`;
    
    const newKid = {
        id: `kid-${Date.now()}`,
        name: newName,
        emoji: randomEmoji,
        avatarUrl: createIllustratedAvatar({
            bgStart: '#ffe5c0',
            bgEnd: '#ff9f6b',
            skin: '#ffd5b2',
            hair: '#2f221d',
            shirt: '#7dd3fc',
            accent: '#38bdf8'
        }),
        avatarGallery: [],
        score: 0,
        ...theme
    };
    
    state.kids.push(newKid);
    state.kids = normalizeKids(state.kids);
    
    addLog(
        newKid.id,
        newName,
        0,
        `新增了成員：${newName}。`,
        newKid.tagColor
    );
    
    renderAllCards();
    renderManageKidsList();
    saveState();
    
    setTimeout(() => {
        closeManageModal();
        openEditModal(newKid.id);
    }, 300);
};

document.getElementById('btn-manage-kids')?.addEventListener('click', openManageModal);
document.getElementById('btn-manage-modal-close')?.addEventListener('click', closeManageModal);
document.getElementById('btn-add-kid')?.addEventListener('click', addNewKid);
manageModalEl?.addEventListener('click', (e) => {
    if (e.target === manageModalEl) {
        closeManageModal();
    }
});

/* ==========================================================================
   重設全部與二次確認 Modal
   ========================================================================== */

const resetModalEl = document.getElementById('modal-reset-confirm');

document.getElementById('btn-reset-all')?.addEventListener('click', () => {
    resetModalEl.classList.add('show');
});

function closeResetModal() {
    resetModalEl.classList.remove('show');
    applyPendingRemoteState();
}

document.getElementById('btn-reset-close')?.addEventListener('click', closeResetModal);
document.getElementById('btn-reset-cancel')?.addEventListener('click', closeResetModal);
resetModalEl?.addEventListener('click', (e) => {
    if (e.target === resetModalEl) {
        closeResetModal();
    }
});

document.getElementById('btn-reset-confirm')?.addEventListener('click', () => {
    state.kids.forEach(kid => {
        kid.score = 0;
    });
    
    state.history = [];
    
    saveState();
    renderAllCards();
    renderHistory();
    closeResetModal();
});

/* ==========================================================================
   清空歷史動態
   ========================================================================== */

document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    state.history = [];
    saveState();
    renderHistory();
});

/* ==========================================================================
   編輯計分板標題 Modal 功能
   ========================================================================== */

const titleModalEl = document.getElementById('modal-edit-title');
const editTitleInput = document.getElementById('edit-scoreboard-title');
const editSubtitleInput = document.getElementById('edit-scoreboard-subtitle');

function openTitleModal() {
    editTitleInput.value = state.title;
    editSubtitleInput.value = state.subtitle;
    titleModalEl.classList.add('show');
}

function closeTitleModal() {
    titleModalEl.classList.remove('show');
    applyPendingRemoteState();
}

function renderScoreboardHeader() {
    const titleEl = document.getElementById('scoreboard-title-text');
    const subtitleEl = document.getElementById('scoreboard-subtitle-text');
    if (titleEl) titleEl.textContent = state.title;
    if (subtitleEl) subtitleEl.textContent = state.subtitle;
}

document.getElementById('btn-edit-scoreboard-title')?.addEventListener('click', openTitleModal);
document.getElementById('btn-title-modal-close')?.addEventListener('click', closeTitleModal);
document.getElementById('btn-title-modal-cancel')?.addEventListener('click', closeTitleModal);

document.getElementById('btn-title-modal-save')?.addEventListener('click', () => {
    const newTitle = editTitleInput.value.trim();
    const newSubtitle = editSubtitleInput.value.trim();
    
    if (!newTitle) {
        alert('請輸入計分板標題！');
        return;
    }
    
    state.title = newTitle;
    state.subtitle = newSubtitle;
    
    renderScoreboardHeader();
    saveState();
    closeTitleModal();
});

titleModalEl?.addEventListener('click', (e) => {
    if (e.target === titleModalEl) {
        closeTitleModal();
    }
});

/* ==========================================================================
   常用原因與點數 (Presets) 編輯 Modal 功能
   ========================================================================== */
const presetsModalEl = document.getElementById('modal-edit-presets');
const presetsEditListEl = document.getElementById('presets-edit-list');
const presetEmojiPickerModalEl = document.getElementById('modal-preset-emoji-picker');
const presetEmojiCategoriesEl = document.getElementById('preset-emoji-categories');

let tempPresets = [];
let activePresetIndexForEmoji = null;

const PRESET_EMOJI_CATEGORIES = [
    {
        name: '🧹 家務與生活 (Chores & Life)',
        emojis: ['🧹', '🧼', '🧽', '🧺', '💦', '🛌', '🛀', '⏰', '💤', '🍳', '🗑️', '🌱', '🍽️', '🥛', '🍼', '🦷', '👕', '🧦', '👟', '🚪', '🔑', '🛋️', '🪞', '🧸', '🚿', '🧴', '🪮', '🩹', '🚽', '🏡']
    },
    {
        name: '📚 學習與學校 (Studies & School)',
        emojis: ['📚', '✏️', '📝', '💯', '🎒', '🎨', '🎹', '💻', '🧪', '🏫', '🧮', '📐', '🧠', '🧩', '🗣️', '📖', '💡', '🎓', '🎭', '🎼', '🎻', '🎷', '🎸', '🎺', '🎤', '🎬', '🖌️', '📏', '📎', '📎']
    },
    {
        name: '⚽ 運動與遊樂 (Sports & Activities)',
        emojis: ['⚽', '🏀', '🏸', '🚲', '🏆', '🥇', '🥈', '🥉', '🏅', '🎮', '🛹', '🏊', '🏃', '🧗', '🥊', '🎪', '🎲', '🧩', '🪁', '🛝', '🛴', '🛼', '🎳', '🎯', '🎣', '⛺', '🎠', '🎡', '🎢', '🎟️']
    },
    {
        name: '⭐ 表現與禮貌 (Behavior & Manners)',
        emojis: ['⭐', '❤️', '👍', '🎉', '🤝', '🎁', '😇', '😀', '😊', '😍', '🥰', '🥳', '😎', '🤩', '👏', '💖', '🌈', '☀️', '🌸', '🍀', '🌟', '💎', '🔥', '🤟', '✨', '🎈', '🔔', '🎗️', '💌', '☮️']
    },
    {
        name: '⚠️ 提醒與常規 (Warnings & Regulars)',
        emojis: ['⚠️', '❌', '🛑', '😭', '😡', '😠', '😤', '🥺', '🤐', '🙅', '👎', '💔', '🌧️', '💩', '🤡', '👻', '👿', '😾', '🩹', '🧻', '🚫', '🔇', '⏳', '💤', '🥀', '🥱', '😰', '🔌', '🪫', '💣']
    },
    {
        name: '🐱 動物與寵物 (Animals & Pets)',
        emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🦄', '🦖', '🦕', '🐙', '🦑', '🐠', '🐬', '🐳', '🐢', '🦋', '🐞']
    },
    {
        name: '🍎 美食與點心 (Food & Snacks)',
        emojis: ['🍎', '🍊', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍔', '🍟', '🍕', '🍩', '🍪', '🧁', '🍫', '🍬', '🍭', '🍦', '🍨', '🍧', '🍰', '🎂', '🍙']
    }
];

window.openPresetsModal = function() {
    renderPresetsEditList();
    presetsModalEl.classList.add('show');
};

function closePresetsModal() {
    presetsModalEl.classList.remove('show');
    applyPendingRemoteState();
}

function renderPresetsEditList() {
    if (!presetsEditListEl) return;
    
    // 複製全域 preset 到暫存陣列以供編輯
    tempPresets = JSON.parse(JSON.stringify(state.presets));
    
    let html = '';
    tempPresets.forEach((preset, idx) => {
        html += `
            <div class="preset-edit-row">
                <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: bold; text-align: center;">#${idx + 1}</span>
                <button type="button" class="preset-edit-icon-btn" onclick="openPresetEmojiPicker(${idx})" title="點擊選擇圖標">${preset.icon}</button>
                <input type="text" class="preset-edit-label" value="${preset.label}" placeholder="原因說明" maxlength="10">
                <input type="number" class="preset-edit-val" value="${preset.val}" placeholder="點數">
            </div>
        `;
    });
    
    presetsEditListEl.innerHTML = html;
}

window.openPresetEmojiPicker = function(idx) {
    activePresetIndexForEmoji = idx;
    renderPresetEmojiPicker();
    presetEmojiPickerModalEl.classList.add('show');
};

function closePresetEmojiPicker() {
    presetEmojiPickerModalEl.classList.remove('show');
    activePresetIndexForEmoji = null;
}

function renderPresetEmojiPicker() {
    if (!presetEmojiCategoriesEl) return;
    
    let html = '';
    PRESET_EMOJI_CATEGORIES.forEach(category => {
        html += `
            <div class="preset-emoji-category" style="margin-bottom: 14px;">
                <h4 style="color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 8px; font-weight: bold;">${category.name}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 6px;">
                    ${category.emojis.map(emoji => `
                        <button type="button" class="preset-emoji-pick-btn" onclick="selectPresetEmoji('${emoji}')">
                            ${emoji}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    });
    presetEmojiCategoriesEl.innerHTML = html;
}

window.selectPresetEmoji = function(emoji) {
    if (activePresetIndexForEmoji !== null) {
        tempPresets[activePresetIndexForEmoji].icon = emoji;
        // 僅更新對應列的按鈕文字，保留輸入框內已輸入的自訂內容
        const rows = presetsEditListEl.querySelectorAll('.preset-edit-row');
        const targetBtn = rows[activePresetIndexForEmoji].querySelector('.preset-edit-icon-btn');
        if (targetBtn) {
            targetBtn.textContent = emoji;
        }
    }
    closePresetEmojiPicker();
};

document.getElementById('btn-presets-modal-save')?.addEventListener('click', () => {
    if (!presetsEditListEl) return;
    const rows = presetsEditListEl.querySelectorAll('.preset-edit-row');
    const newPresets = [];
    let hasError = false;
    
    rows.forEach((row, idx) => {
        const icon = tempPresets[idx].icon;
        const label = row.querySelector('.preset-edit-label').value.trim();
        const val = parseInt(row.querySelector('.preset-edit-val').value, 10);
        
        if (!icon || !label || isNaN(val)) {
            hasError = true;
            return;
        }
        
        newPresets.push({ icon, label, val });
    });
    
    if (hasError) {
        alert('請填寫所有欄位且點數必須是有效的數字！');
        return;
    }
    
    state.presets = newPresets;
    saveState();
    renderAllCards();
    closePresetsModal();
});

document.getElementById('btn-presets-modal-close')?.addEventListener('click', closePresetsModal);
document.getElementById('btn-presets-modal-cancel')?.addEventListener('click', closePresetsModal);
presetsModalEl?.addEventListener('click', (e) => {
    if (e.target === presetsModalEl) {
        closePresetsModal();
    }
});

document.getElementById('btn-preset-emoji-close')?.addEventListener('click', closePresetEmojiPicker);
presetEmojiPickerModalEl?.addEventListener('click', (e) => {
    if (e.target === presetEmojiPickerModalEl) {
        closePresetEmojiPicker();
    }
});

/* ==========================================================================
   初始化啟動 (Initialization)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    renderAllState();
    startRealtimeSync();
});
