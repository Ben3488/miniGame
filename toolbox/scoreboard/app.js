/* ==========================================================================
   兒童表現計分板 - 核心應用程式邏輯 (app.js)
   ========================================================================== */

const STORAGE_VERSION_KEY = 'kids_scoreboard_mockup_version';
const STORAGE_VERSION = 'scoreboard-mockup-v3';
const MAX_AVATAR_UPLOADS = 5;

// 預設大頭貼 Emoji 列表
const CURED_EMOJIS = [
    '👶', '👧', '👦', '🐱', '🐶', '🦄', '🦖', '🦁', '🐼', '🦊',
    '🐯', '🐰', '🐨', '🐷', '🐸', '🚀', '⭐', '🌈', '🎨', '⚽'
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

// 預設兒童資料
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
        gradientId: 'gradient-orange',
        glowColor: 'rgba(249, 115, 22, 0.15)',
        glowStrong: 'rgba(249, 115, 22, 0.45)',
        tagColor: '#f97316'
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
        gradientId: 'gradient-pink',
        glowColor: 'rgba(236, 72, 153, 0.15)',
        glowStrong: 'rgba(236, 72, 153, 0.45)',
        tagColor: '#ec4899'
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
        gradientId: 'gradient-blue',
        glowColor: 'rgba(59, 130, 246, 0.15)',
        glowStrong: 'rgba(59, 130, 246, 0.45)',
        tagColor: '#3b82f6'
    }
];

const DEFAULT_HISTORY = [
    {
        kidId: 'kid-2',
        name: '柚子',
        typeText: '減 0 分',
        scoreChange: 0,
        reason: '變更資料：上傳了自拍大頭照。',
        time: '08:54:49',
        tagColor: '#ec4899'
    },
    {
        kidId: 'kid-2',
        name: '柚子',
        typeText: '加 1 分',
        scoreChange: 1,
        reason: '打掃',
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
    },
    {
        kidId: 'kid-1',
        name: '橘子',
        typeText: '減 1 分',
        scoreChange: -1,
        reason: '忘記收玩具',
        time: '08:29:21',
        tagColor: '#f97316'
    },
    {
        kidId: 'kid-1',
        name: '橘子',
        typeText: '加 1 分',
        scoreChange: 1,
        reason: '幫忙洗碗',
        time: '08:20:03',
        tagColor: '#f97316'
    }
];

// SVG 圓圈半徑與周長 (r=70, C=2*pi*r ≈ 439.82)
const RING_CIRCUMFERENCE = 439.82;

// 應用程式狀態 (State)
let state = {
    kids: [],
    history: [],
    editingKidId: null,
    selectedEmoji: '',
    title: '寶貝表現計分板',
    subtitle: '記錄寶貝的日常表現，累積100分拿大獎！'
};

function getDefaultState() {
    return {
        kids: JSON.parse(JSON.stringify(DEFAULT_KIDS)),
        history: JSON.parse(JSON.stringify(DEFAULT_HISTORY)),
        title: '寶貝表現計分板',
        subtitle: '記錄寶貝的日常表現，累積100分拿大獎！'
    };
}

function dedupeAvatarGallery(photos = []) {
    return [...new Set(photos.filter(Boolean))].slice(0, MAX_AVATAR_UPLOADS);
}

function isUploadedPhotoDataUrl(photo = '') {
    return typeof photo === 'string' && photo.startsWith('data:image/jpeg');
}

function normalizeKid(kid, index) {
    const fallback = DEFAULT_KIDS[index] || DEFAULT_KIDS[0];
    const avatarGallery = dedupeAvatarGallery([
        ...(Array.isArray(kid.avatarGallery) ? kid.avatarGallery : []),
        isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : ''
    ]);

    return {
        ...fallback,
        ...kid,
        avatarUrl: kid.avatarUrl || fallback.avatarUrl,
        avatarGallery
    };
}

function mergeKidsWithDefaults(savedKids = []) {
    return DEFAULT_KIDS.map((defaultKid, index) => {
        const matchedKid = savedKids.find(kid => kid.id === defaultKid.id) || savedKids[index] || defaultKid;
        return normalizeKid(matchedKid, index);
    });
}

/* ==========================================================================
   LocalStorage 資料讀寫
   ========================================================================== */

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
        localStorage.setItem('kids_scoreboard_data', JSON.stringify(state.kids));
        localStorage.setItem('kids_scoreboard_history', JSON.stringify(state.history));
        localStorage.setItem('kids_scoreboard_title', state.title);
        localStorage.setItem('kids_scoreboard_subtitle', state.subtitle);
    } catch (e) {
        console.error('儲存至 LocalStorage 失敗。', e);
    }
}

async function loadState() {
    // 1. 優先嘗試向 NAS 後端讀取資料
    try {
        const response = await fetch('api.php');
        if (response.ok) {
            const serverData = await response.json();
            if (serverData && serverData.kids && serverData.kids.length > 0) {
                state.kids = mergeKidsWithDefaults(serverData.kids);
                state.history = serverData.history || [];
                state.title = serverData.title || getDefaultState().title;
                state.subtitle = serverData.subtitle || getDefaultState().subtitle;

                // 舊預設角色升級檢查
                const isOldDefault = state.kids.length === 3 &&
                                     state.kids.some(k => k.name === '小明' || k.name === '小華' || k.name === '小強');
                if (isOldDefault) {
                    state.kids = getDefaultState().kids;
                    await saveState();
                } else {
                    saveToLocalStorage();
                }
                return;
            }
        }
    } catch (e) {
        console.warn('無法從 NAS api.php 載入資料，將降級使用本機 LocalStorage。', e);
    }

    // 2. 降級方案：從本機 LocalStorage 載入資料
    try {
        const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
        const savedKids = localStorage.getItem('kids_scoreboard_data');
        const savedHistory = localStorage.getItem('kids_scoreboard_history');
        const savedTitle = localStorage.getItem('kids_scoreboard_title');
        const savedSubtitle = localStorage.getItem('kids_scoreboard_subtitle');

        if (!savedKids && !savedHistory && !savedTitle && !savedSubtitle) {
            const defaults = getDefaultState();
            state.kids = defaults.kids;
            state.history = defaults.history;
            state.title = defaults.title;
            state.subtitle = defaults.subtitle;
            saveToLocalStorage();
            return;
        }

        if (savedKids) {
            state.kids = mergeKidsWithDefaults(JSON.parse(savedKids));
            const isOldDefault = state.kids.length === 3 &&
                                 state.kids.some(k => k.name === '小明' || k.name === '小華' || k.name === '小強');
            if (isOldDefault) {
                state.kids = getDefaultState().kids;
                saveToLocalStorage();
            }
        } else {
            state.kids = getDefaultState().kids;
        }

        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        } else {
            state.history = getDefaultState().history;
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

    try {
        const payload = {
            kids: state.kids,
            history: state.history,
            title: state.title,
            subtitle: state.subtitle
        };
        await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('資料同步至 NAS 失敗。', e);
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
    // 噴灑多次創造華麗感
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
        // 隨機在左右兩側噴灑
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
            const max_size = 180; // Resize to max 180x180 px for avatar
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions (crop to square)
            const size = Math.min(width, height);
            canvas.width = max_size;
            canvas.height = max_size;
            
            const ctx = canvas.getContext('2d');
            // Center crop and draw to canvas
            ctx.drawImage(
                img,
                (width - size) / 2, (height - size) / 2, size, size, // source rect
                0, 0, max_size, max_size // destination rect
            );
            
            // Convert to base64 jpeg with 0.85 quality
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            callback(base64);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 建立單個兒童計分板卡片 HTML
function createKidCardHTML(kid) {
    // 計算 SVG progress offset (r=42, C = 2 * Math.PI * 42 = 263.89)
    const RING_CIRCUMFERENCE_100 = 263.89;
    const offset = RING_CIRCUMFERENCE_100 - (kid.score / 100) * RING_CIRCUMFERENCE_100;
    
    // 生成星星 HTML (5顆星)
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

    const isFullScore = kid.score === 100;

    return `
        <article class="kid-card glass-panel" id="card-${kid.id}" style="--card-gradient: var(--${kid.id}-gradient, url(#${kid.gradientId})); --card-glow: ${kid.glowColor}; --card-glow-strong: ${kid.glowStrong}; --theme-color: ${kid.tagColor};">
            <!-- 編輯按鈕 (三個點) -->
            <button class="btn-edit-profile" onclick="openEditModal('${kid.id}')" title="修改大頭貼與名字">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
            
            <!-- 卡片頭部 (水果 Emoji + 姓名) -->
            <div class="kid-card-header">
                <div class="kid-title-container">
                    <span class="kid-fruit-emoji">${kid.emoji}</span>
                    <h2 class="kid-name">${kid.name}</h2>
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

            <!-- 備註輸入欄位 -->
            <div class="note-input-container">
                <div class="note-input-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="note-input-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <input type="text" class="note-input" id="note-${kid.id}" placeholder="輸入加/減分原因（例如：幫忙洗碗）" maxlength="30">
                </div>
            </div>

            <!-- 控制按鈕 (圓形外框樣式) -->
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
        container.innerHTML = '<div class="card-loading">目前無資料。</div>';
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
    
    // 1. 更新分數文字
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
    
    // 2. 更新環形進度條 offset (r=42, C=263.89)
    const progressEl = cardEl.querySelector('.score-svg-progress');
    if (progressEl) {
        const offset = 263.89 - (kid.score / 100) * 263.89;
        progressEl.style.strokeDashoffset = offset;
    }
    
    // 3. 更新星星
    const starIcons = cardEl.querySelectorAll('.star-icon');
    starIcons.forEach((star, idx) => {
        const milestoneVal = (idx + 1) * 20;
        if (kid.score >= milestoneVal) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    // 4. 更新大頭貼和姓名 (如果在 Modal 編輯了)
    const avatarWrapper = cardEl.querySelector('.avatar-image-wrapper');
    if (avatarWrapper) {
        if (kid.avatarUrl) {
            avatarWrapper.innerHTML = `<img src="${kid.avatarUrl}" class="avatar-img" alt="${kid.name}">`;
        } else {
            avatarWrapper.innerHTML = `<span class="avatar-emoji">${kid.emoji}</span>`;
        }
    }
    
    const fruitEmojiEl = cardEl.querySelector('.kid-fruit-emoji');
    if (fruitEmojiEl) fruitEmojiEl.textContent = kid.emoji;

    const nameEl = cardEl.querySelector('.kid-name');
    if (nameEl) nameEl.textContent = kid.name;
}

/* ==========================================================================
   歷史紀錄 Log 功能
   ========================================================================== */

function addLog(kidId, name, scoreChange, reason, kidTagColor) {
    const time = getFormattedTime();
    const typeText = scoreChange > 0 ? `加 ${scoreChange} 分` : `減 ${Math.abs(scoreChange)} 分`;
    
    const newLog = {
        kidId,
        name,
        typeText,
        scoreChange,
        reason: reason.trim() || (scoreChange > 0 ? '表現良好！' : '仍需加油！'),
        time,
        tagColor: kidTagColor
    };
    
    // 新增至陣列開頭
    state.history.unshift(newLog);
    
    // 限制最多 50 筆紀錄
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
        const scoreStyle = log.scoreChange > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #f43f5e; font-weight: bold;';
        
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

window.changeScore = function(kidId, amount) {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    const prevScore = kid.score;
    let newScore = prevScore + amount;
    
    // 限制在 0-100 分之間
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;
    
    // 若分數無實質變動則直接返回
    if (newScore === prevScore) return;
    
    kid.score = newScore;
    
    // 獲取輸入原因備註
    const inputEl = document.getElementById(`note-${kidId}`);
    const reason = inputEl ? inputEl.value : '';
    
    // 新增歷史紀錄
    addLog(kid.id, kid.name, amount, reason, kid.tagColor);
    
    // 觸發局部更新 DOM
    updateCardDOM(kid);
    saveState();
    
    // 如果分數變成 100，則啟動慶祝 Confetti！
    if (newScore === 100 && prevScore < 100) {
        triggerCelebration();
        // 額外新增一筆滿分賀詞紀錄
        setTimeout(() => {
            addLog(kid.id, kid.name, 0, '恭喜達到 100 分滿分！🎉🏆 太棒了！', '#d97706');
        }, 300);
    }
    
    // 清空該卡片的備註輸入框
    if (inputEl) {
        inputEl.value = '';
    }
};

/* ==========================================================================
   編輯寶貝 Modal 功能
   ========================================================================== */

const editModalEl = document.getElementById('modal-edit-profile');
const editNameInput = document.getElementById('edit-name');
const emojiGridEl = document.getElementById('emoji-grid');
const uploadGalleryEl = document.getElementById('upload-gallery');
let uploadedAvatarBase64 = ''; // 暫存Modal中上傳的 Base64 圖片
let uploadedAvatarHistory = [];

window.openEditModal = function(kidId) {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    state.editingKidId = kidId;
    state.selectedEmoji = kid.emoji;
    editNameInput.value = kid.name;
    uploadedAvatarBase64 = isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : '';
    uploadedAvatarHistory = dedupeAvatarGallery([
        ...(Array.isArray(kid.avatarGallery) ? kid.avatarGallery : []),
        isUploadedPhotoDataUrl(kid.avatarUrl) ? kid.avatarUrl : ''
    ]);
    
    // 重設檔案輸入框的值
    const fileInput = document.getElementById('edit-avatar-file');
    if (fileInput) fileInput.value = '';
    
    updateUploadPreview();
    
    // 生成 Emoji 選擇網格
    renderEmojiGrid();
    
    // 顯示 Modal
    editModalEl.classList.add('show');
};

function closeEditModal() {
    editModalEl.classList.remove('show');
    state.editingKidId = null;
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

// 檔案上傳觸發
document.getElementById('btn-upload-trigger')?.addEventListener('click', () => {
    document.getElementById('edit-avatar-file')?.click();
});

document.getElementById('edit-avatar-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 每次新上傳都先清掉舊的檔案選取狀態，避免殘留前一張檔案。
    e.target.value = '';

    // 壓縮並調整圖片大小
    compressImage(file, (base64) => {
        uploadedAvatarBase64 = base64;
        uploadedAvatarHistory = dedupeAvatarGallery([
            base64,
            ...uploadedAvatarHistory.filter(photo => photo !== base64)
        ]);
        updateUploadPreview();
    });
});

// 移除自訂大頭照
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
    // 清除舊的選擇狀態
    const selected = emojiGridEl.querySelector('.emoji-option.selected');
    if (selected) {
        selected.classList.remove('selected');
    }
    
    // 設定新的選擇狀態
    element.classList.add('selected');
    state.selectedEmoji = emoji;
};

// 儲存修改
document.getElementById('btn-modal-save')?.addEventListener('click', () => {
    if (!state.editingKidId) return;
    
    const kid = state.kids.find(k => k.id === state.editingKidId);
    const newName = editNameInput.value.trim();
    
    if (!newName) {
        alert('請輸入寶貝名字！');
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
    
    // 寫入更名紀錄
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

// 取消與關閉 Modal
document.getElementById('btn-modal-close')?.addEventListener('click', closeEditModal);
document.getElementById('btn-modal-cancel')?.addEventListener('click', closeEditModal);

// 點擊 Modal 背景關閉
editModalEl?.addEventListener('click', (e) => {
    if (e.target === editModalEl) {
        closeEditModal();
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
}

document.getElementById('btn-reset-close')?.addEventListener('click', closeResetModal);
document.getElementById('btn-reset-cancel')?.addEventListener('click', closeResetModal);
resetModalEl?.addEventListener('click', (e) => {
    if (e.target === resetModalEl) {
        closeResetModal();
    }
});

// 確認重設全部
document.getElementById('btn-reset-confirm')?.addEventListener('click', () => {
    // 1. 所有分數歸零
    state.kids.forEach(kid => {
        kid.score = 0;
    });
    
    // 2. 清空歷史紀錄
    state.history = [];
    
    // 3. 儲存與重新渲染
    saveState();
    renderAllCards();
    renderHistory();
    
    // 4. 關閉 Modal
    closeResetModal();
});

/* ==========================================================================
   清空歷史動態 (僅清空紀錄，不影響分數)
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

// 儲存修改
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

// 點擊 Modal 背景關閉
titleModalEl?.addEventListener('click', (e) => {
    if (e.target === titleModalEl) {
        closeTitleModal();
    }
});

/* ==========================================================================
   初始化啟動 (Initialization)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    // 載入狀態
    await loadState();
    
    // 渲染 UI
    renderScoreboardHeader();
    renderAllCards();
    renderHistory();
});
