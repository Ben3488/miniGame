/* ==========================================================================
   智慧小工具包主面板控制器 (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const iframe = document.getElementById('tool-viewport');
    const loader = document.getElementById('tool-loader');
    const newTabBtn = document.getElementById('btn-open-new-tab');
    const sidebar = document.getElementById('dashboard-sidebar');
    const container = document.querySelector('.dashboard-container');
    const collapseBtn = document.getElementById('btn-sidebar-collapse');
    const expandFab = document.getElementById('btn-sidebar-expand');

    // 切換工具
    function switchTool(targetItem) {
        if (targetItem.classList.contains('active')) return;

        // 移除其他按鈕的 active 狀態
        navItems.forEach(item => item.classList.remove('active'));

        // 新增 active 狀態到點選項目
        targetItem.classList.add('active');

        // 顯示載入動畫
        loader.classList.remove('hidden');

        // 變更 iframe 網址
        const toolUrl = targetItem.getAttribute('data-url');
        iframe.src = toolUrl;

        // 切換工具後，在橫向模式自動收合側邊欄
        if (isLandscapeMobile()) {
            setTimeout(() => collapseSidebar(), 400);
        }
    }

    // 判斷是否為橫向行動裝置
    function isLandscapeMobile() {
        return window.innerWidth <= 900 && window.innerWidth > window.innerHeight;
    }

    // 收合側邊欄
    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        container.classList.add('sidebar-hidden');
        expandFab.classList.add('visible');
    }

    // 展開側邊欄
    function expandSidebar() {
        sidebar.classList.remove('collapsed');
        container.classList.remove('sidebar-hidden');
        expandFab.classList.remove('visible');
    }

    // 橫向模式自動收合：進入橫向時自動收合
    function handleOrientationLayout() {
        if (isLandscapeMobile()) {
            // 橫向時自動收合
            collapseSidebar();
        } else {
            // 直立或桌面：展開並移除所有收合狀態
            expandSidebar();
        }
    }

    // 收合按鈕（sidebar 內部的 ▲ 按鈕）
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            collapseSidebar();
        });
    }

    // 展開 FAB 按鈕（收合後右上角的 ☰ 按鈕）
    if (expandFab) {
        expandFab.addEventListener('click', () => {
            expandSidebar();
        });
    }

    // 綁定導覽按鈕點擊事件
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTool(item);
        });
    });

    // 當 iframe 載入完成時，隱藏載入動畫
    iframe.addEventListener('load', () => {
        // 延遲一點點時間讓轉場更加順暢
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 150);
    });

    // 在新分頁打開目前工具
    newTabBtn.addEventListener('click', () => {
        const currentUrl = iframe.src || iframe.contentWindow.location.href;
        if (currentUrl) {
            window.open(currentUrl, '_blank');
        }
    });

    // 支援從網址 Hash 直接切換對應工具 (例如: index.html#remover)
    function handleHashRoute() {
        const hash = window.location.hash;
        if (hash) {
            let targetId = '';
            if (hash === '#scoreboard') targetId = 'nav-btn-scoreboard';
            else if (hash === '#remover') targetId = 'nav-btn-bgremover';
            else if (hash === '#downloader') targetId = 'nav-btn-downloader';

            const targetBtn = document.getElementById(targetId);
            if (targetBtn) {
                switchTool(targetBtn);
            }
        }
    }

    // 監聽 Hash 改變
    window.addEventListener('hashchange', handleHashRoute);

    // 監聽螢幕旋轉 / 視窗大小改變，自動調整側邊欄狀態
    window.addEventListener('resize', handleOrientationLayout);

    // 初始化路徑檢查 & 方向佈局
    handleHashRoute();
    handleOrientationLayout();
});

