/* ==========================================================================
   智慧小工具包主面板控制器 (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const container   = document.querySelector('.dashboard-container');
    const navItems    = document.querySelectorAll('.nav-item');
    const iframe      = document.getElementById('tool-viewport');
    const loader      = document.getElementById('tool-loader');
    const newTabBtn   = document.getElementById('btn-open-new-tab');
    const sidebar     = document.getElementById('dashboard-sidebar');
    const collapseBtn = document.getElementById('btn-sidebar-collapse');
    const expandFab   = document.getElementById('btn-sidebar-expand');

    // ── 橫向媒體查詢（最可靠的偵測方式）──
    const landscapeQuery = window.matchMedia(
        '(max-width: 950px) and (orientation: landscape)'
    );

    function isLandscape() {
        return landscapeQuery.matches;
    }

    // ── 收合側邊欄 ──
    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        if (container) container.classList.add('sidebar-collapsed');
        expandFab.classList.add('visible');
    }

    // ── 展開側邊欄 ──
    function expandSidebar() {
        sidebar.classList.remove('collapsed');
        if (container) container.classList.remove('sidebar-collapsed');
        expandFab.classList.remove('visible');
    }

    // ── 根據方向自動調整 ──
    function handleLayout() {
        if (isLandscape()) {
            collapseSidebar();  // 橫向：自動收合
        } else {
            expandSidebar();    // 直立 / 桌面：恢復展開
        }
    }

    // ── 收合按鈕（sidebar 右側 ▲）──
    if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collapseSidebar();
        });
    }

    // ── 展開 FAB 按鈕（固定右上角 ☰）──
    if (expandFab) {
        expandFab.addEventListener('click', (e) => {
            e.stopPropagation();
            expandSidebar();
        });
    }

    // ── 切換工具 ──
    function switchTool(targetItem) {
        if (targetItem.classList.contains('active')) return;

        navItems.forEach(item => item.classList.remove('active'));
        targetItem.classList.add('active');
        loader.classList.remove('hidden');

        const toolUrl = targetItem.getAttribute('data-url');
        if (toolUrl) iframe.src = toolUrl;

        // 選完工具後自動收合（橫向模式）
        if (isLandscape()) {
            setTimeout(() => collapseSidebar(), 300);
        }
    }

    // ── 綁定導覽按鈕 ──
    navItems.forEach(item => {
        item.addEventListener('click', () => switchTool(item));
    });

    // ── iframe 載入完成隱藏 loader ──
    iframe.addEventListener('load', () => {
        setTimeout(() => loader.classList.add('hidden'), 150);
    });

    // ── 在新分頁開啟目前工具 ──
    if (newTabBtn) {
        newTabBtn.addEventListener('click', () => {
            const currentUrl = iframe.src || iframe.contentWindow?.location?.href;
            if (currentUrl) window.open(currentUrl, '_blank');
        });
    }

    // ── Hash 路由 ──
    function handleHashRoute() {
        const hash = window.location.hash;
        if (!hash) return;

        const idMap = {
            '#scoreboard': 'nav-btn-scoreboard',
            '#multiscoreboard': 'nav-btn-multiscoreboard',
            '#remover':    'nav-btn-bgremover',
            '#downloader': 'nav-btn-downloader',
        };
        const btn = document.getElementById(idMap[hash]);
        if (btn) switchTool(btn);
    }

    // ── 監聽方向改變（matchMedia 事件，處理舊版瀏覽器相容性）──
    if (typeof landscapeQuery.addEventListener === 'function') {
        landscapeQuery.addEventListener('change', handleLayout);
    } else if (typeof landscapeQuery.addListener === 'function') {
        landscapeQuery.addListener(handleLayout);
    }

    // ── 初始化 ──
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
    handleLayout(); // 頁面載入時立刻套用正確佈局
});
