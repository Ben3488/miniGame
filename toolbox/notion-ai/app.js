/* ==========================================================================
   Notion AI Redirector Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const workspaceUrlInput = document.getElementById('workspace-url');
    const scratchpadInput = document.getElementById('scratchpad-text');
    const btnClearScratch = document.getElementById('btn-clear-scratch');
    const btnRedirect = document.getElementById('btn-redirect');
    const toast = document.getElementById('toast-notify');

    // ── Load saved states ──
    const savedUrl = localStorage.getItem('notion_workspace_url') || '';
    const savedText = localStorage.getItem('notion_scratchpad_draft') || '';

    workspaceUrlInput.value = savedUrl;
    scratchpadInput.value = savedText;

    // Save workspace URL change
    workspaceUrlInput.addEventListener('input', () => {
        localStorage.setItem('notion_workspace_url', workspaceUrlInput.value.trim());
    });

    // Auto-save draft text
    scratchpadInput.addEventListener('input', () => {
        localStorage.setItem('notion_scratchpad_draft', scratchpadInput.value);
    });

    // Clear draft action
    btnClearScratch.addEventListener('click', () => {
        if (confirm('確定要清空草稿紙內容嗎？')) {
            scratchpadInput.value = '';
            localStorage.removeItem('notion_scratchpad_draft');
            scratchpadInput.focus();
        }
    });

    // Copy draft & Redirect
    btnRedirect.addEventListener('click', () => {
        const text = scratchpadInput.value.trim();
        let targetUrl = workspaceUrlInput.value.trim() || 'https://www.notion.so/';

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToastAndRedirect(targetUrl);
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
                window.open(targetUrl, '_blank');
            });
        } else {
            window.open(targetUrl, '_blank');
        }
    });

    function showToastAndRedirect(url) {
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            window.open(url, '_blank');
        }, 800);

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
