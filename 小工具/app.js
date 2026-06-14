/* ==========================================================================
   智慧小工具包主面板控制器 (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const iframe = document.getElementById('tool-viewport');
    const loader = document.getElementById('tool-loader');
    const newTabBtn = document.getElementById('btn-open-new-tab');

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
    
    // 初始化路徑檢查
    handleHashRoute();
});
