/* ==========================================================================
   ChatGPT / Claude Redirector Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const tabChatGPT = document.getElementById('btn-chatgpt');
    const tabClaude = document.getElementById('btn-claude');
    const promptInput = document.getElementById('prompt-text');
    const templateBtns = document.querySelectorAll('.btn-template');
    const btnRedirect = document.getElementById('btn-redirect');
    const toast = document.getElementById('toast-notify');

    let currentTarget = 'https://chatgpt.com/';

    // Switch platforms
    tabChatGPT.addEventListener('click', () => {
        tabChatGPT.classList.add('active');
        tabClaude.classList.remove('active');
        currentTarget = tabChatGPT.getAttribute('data-target');
    });

    tabClaude.addEventListener('click', () => {
        tabClaude.classList.add('active');
        tabChatGPT.classList.remove('active');
        currentTarget = tabClaude.getAttribute('data-target');
    });

    // Preset templates click
    templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const rawPrompt = btn.getAttribute('data-prompt');
            // Decode newline character literals
            promptInput.value = rawPrompt.replace(/\\n/g, '\n');
            promptInput.focus();
        });
    });

    // Copy prompt & Redirect
    btnRedirect.addEventListener('click', () => {
        const text = promptInput.value.trim();

        if (text) {
            // Write prompt to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showToastAndRedirect();
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
                // Redirect anyway
                window.open(currentTarget, '_blank');
            });
        } else {
            // Empty input - just redirect
            window.open(currentTarget, '_blank');
        }
    });

    function showToastAndRedirect() {
        // Show Toast
        toast.classList.remove('hidden');
        
        // Hide Toast after animation and open window
        setTimeout(() => {
            window.open(currentTarget, '_blank');
        }, 800);

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
