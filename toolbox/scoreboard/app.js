/* ==========================================================================
   兒童表現計分板 - 核心應用程式邏輯 (app.js)
   ========================================================================== */

// 預設大頭貼 Emoji 列表
const CURED_EMOJIS = [
    '👶', '👧', '👦', '🐱', '🐶', '🦄', '🦖', '🦁', '🐼', '🦊',
    '🐯', '🐰', '🐨', '🐷', '🐸', '🚀', '⭐', '🌈', '🎨', '⚽'
];

// 預設兒童資料
const DEFAULT_KIDS = [
    {
        id: 'kid-1',
        name: '小明',
        emoji: '👶',
        score: 0,
        gradientId: 'gradient-green',
        glowColor: 'rgba(16, 185, 129, 0.2)',
        glowStrong: 'rgba(16, 185, 129, 0.45)',
        tagColor: '#059669'
    },
    {
        id: 'kid-2',
        name: '小華',
        emoji: '👧',
        score: 0,
        gradientId: 'gradient-pink',
        glowColor: 'rgba(236, 72, 153, 0.2)',
        glowStrong: 'rgba(236, 72, 153, 0.45)',
        tagColor: '#d946ef'
    },
    {
        id: 'kid-3',
        name: '小強',
        emoji: '👦',
        score: 0,
        gradientId: 'gradient-blue',
        glowColor: 'rgba(59, 130, 246, 0.2)',
        glowStrong: 'rgba(59, 130, 246, 0.45)',
        tagColor: '#3b82f6'
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
    subtitle: '記錄寶貝的日常好表現，累積 100 分拿大獎！'
};

/* ==========================================================================
   LocalStorage 資料讀寫
   ========================================================================== */

function loadState() {
    try {
        const savedKids = localStorage.getItem('kids_scoreboard_data');
        const savedHistory = localStorage.getItem('kids_scoreboard_history');
        const savedTitle = localStorage.getItem('kids_scoreboard_title');
        const savedSubtitle = localStorage.getItem('kids_scoreboard_subtitle');
        
        if (savedKids) {
            state.kids = JSON.parse(savedKids);
        } else {
            state.kids = JSON.parse(JSON.stringify(DEFAULT_KIDS)); // 深拷貝
        }
        
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        } else {
            state.history = [];
        }

        if (savedTitle) {
            state.title = savedTitle;
        } else {
            state.title = '寶貝表現計分板';
        }

        if (savedSubtitle) {
            state.subtitle = savedSubtitle;
        } else {
            state.subtitle = '記錄寶貝的日常好表現，累積 100 分拿大獎！';
        }
    } catch (e) {
        console.error('讀取 LocalStorage 失敗，使用預設值。', e);
        state.kids = JSON.parse(JSON.stringify(DEFAULT_KIDS));
        state.history = [];
        state.title = '寶貝表現計分板';
        state.subtitle = '記錄寶貝的日常好表現，累積 100 分拿大獎！';
    }
}

function saveState() {
    try {
        localStorage.setItem('kids_scoreboard_data', JSON.stringify(state.kids));
        localStorage.setItem('kids_scoreboard_history', JSON.stringify(state.history));
        localStorage.setItem('kids_scoreboard_title', state.title);
        localStorage.setItem('kids_scoreboard_subtitle', state.subtitle);
    } catch (e) {
        console.error('儲存至 LocalStorage 失敗。', e);
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

// 建立單個兒童計分板卡片 HTML
function createKidCardHTML(kid) {
    // 計算 SVG progress offset
    const offset = RING_CIRCUMFERENCE - (kid.score / 100) * RING_CIRCUMFERENCE;
    
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
        <article class="kid-card glass-panel" id="card-${kid.id}" style="--card-gradient: var(--${kid.id}-gradient, url(#${kid.gradientId})); --card-glow: ${kid.glowColor}; --card-glow-strong: ${kid.glowStrong};">
            <!-- 編輯按鈕 -->
            <button class="btn-edit-profile" onclick="openEditModal('${kid.id}')" title="修改大頭貼與名字">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            
            <!-- 卡片頭部 -->
            <div class="kid-card-header">
                <div class="avatar-container" onclick="openEditModal('${kid.id}')">${kid.emoji}</div>
                <h2 class="kid-name">${kid.name}</h2>
            </div>
            
            <!-- 分數環形儀表板 -->
            <div class="score-circle-wrapper">
                <svg class="score-svg-ring" width="160" height="160">
                    <circle class="score-svg-bg" cx="80" cy="80" r="70"></circle>
                    <circle class="score-svg-progress" cx="80" cy="80" r="70" 
                            stroke="url(#${kid.gradientId})" 
                            stroke-dasharray="${RING_CIRCUMFERENCE}" 
                            stroke-dashoffset="${offset}"></circle>
                </svg>
                <div class="score-display">
                    <span class="score-number">${kid.score}</span>
                    <span class="score-unit">分 / 100</span>
                </div>
                <div class="full-score-badge ${isFullScore ? 'show' : ''}">🏆 滿分 100!</div>
            </div>

            <!-- 星星里程碑 -->
            <div class="milestones-stars" title="每 20 分獲得一顆星星！">
                ${starsHTML}
            </div>

            <!-- 備註輸入欄位 -->
            <div class="note-input-container">
                <input type="text" class="note-input" id="note-${kid.id}" placeholder="輸入加/減分原因 (例如：幫忙洗碗)" maxlength="30">
            </div>

            <!-- 控制按鈕 -->
            <div class="controls-container">
                <button class="btn-ctrl btn-minus" onclick="changeScore('${kid.id}', -1)" title="扣 1 分">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>
                </button>
                <button class="btn-ctrl btn-plus" onclick="changeScore('${kid.id}', 1)" style="background: url(#${kid.gradientId}); background-color: var(--${kid.id}-start);" title="加 1 分">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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

// 局部更新單個兒童卡片 (保持其他卡片的輸入框文字不受重置影響，並且支援動畫)
function updateCardDOM(kid) {
    const cardEl = document.getElementById(`card-${kid.id}`);
    if (!cardEl) return;
    
    // 1. 更新分數文字
    const scoreNumEl = cardEl.querySelector('.score-number');
    if (scoreNumEl) {
        // 加分減分時有小動畫
        const oldScore = parseInt(scoreNumEl.textContent);
        if (oldScore !== kid.score) {
            scoreNumEl.textContent = kid.score;
            scoreNumEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreNumEl.style.transform = 'scale(1)';
            }, 150);
        }
    }
    
    // 2. 更新環形進度條 offset
    const progressEl = cardEl.querySelector('.score-svg-progress');
    if (progressEl) {
        const offset = RING_CIRCUMFERENCE - (kid.score / 100) * RING_CIRCUMFERENCE;
        progressEl.style.strokeDashoffset = offset;
    }
    
    // 3. 更新滿分標籤
    const badgeEl = cardEl.querySelector('.full-score-badge');
    if (badgeEl) {
        if (kid.score === 100) {
            badgeEl.classList.add('show');
        } else {
            badgeEl.classList.remove('show');
        }
    }
    
    // 4. 更新星星
    const starIcons = cardEl.querySelectorAll('.star-icon');
    starIcons.forEach((star, idx) => {
        const milestoneVal = (idx + 1) * 20;
        if (kid.score >= milestoneVal) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    // 5. 更新大頭貼和姓名 (如果在 Modal 編輯了)
    const avatarEl = cardEl.querySelector('.avatar-container');
    if (avatarEl) avatarEl.textContent = kid.emoji;
    
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
        const colorStyle = log.tagColor ? `background-color: ${log.tagColor};` : 'background-color: var(--btn-secondary);';
        const scoreStyle = log.scoreChange > 0 ? 'color: #10b981; font-weight: bold;' : 'color: #f43f5e; font-weight: bold;';
        
        html += `
            <li class="history-item">
                <div class="history-item-content">
                    <span class="history-kid-tag" style="${colorStyle}">${log.name}</span>
                    <span class="history-item-text">
                        得到 <span style="${scoreStyle}">${log.typeText}</span>
                    </span>
                    <span class="history-item-reason">(${log.reason})</span>
                </div>
                <span class="history-item-time">${log.time}</span>
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

window.openEditModal = function(kidId) {
    const kid = state.kids.find(k => k.id === kidId);
    if (!kid) return;
    
    state.editingKidId = kidId;
    state.selectedEmoji = kid.emoji;
    editNameInput.value = kid.name;
    
    // 生成 Emoji 選擇網格
    renderEmojiGrid();
    
    // 顯示 Modal
    editModalEl.classList.add('show');
};

function closeEditModal() {
    editModalEl.classList.remove('show');
    state.editingKidId = null;
}

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
    
    kid.name = newName;
    kid.emoji = state.selectedEmoji;
    
    // 寫入更名紀錄
    if (oldName !== newName || oldEmoji !== state.selectedEmoji) {
        addLog(
            kid.id, 
            newName, 
            0, 
            `變更資料：頭像改為 ${state.selectedEmoji}，名字由 ${oldName} 改為 ${newName}`, 
            kid.tagColor
        );
    }
    
    updateCardDOM(kid);
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

document.addEventListener('DOMContentLoaded', () => {
    // 載入狀態
    loadState();
    
    // 渲染 UI
    renderScoreboardHeader();
    renderAllCards();
    renderHistory();
});
