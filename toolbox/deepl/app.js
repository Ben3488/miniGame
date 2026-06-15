/* ==========================================================================
   DeepL Redirector Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('translate-text');
    const langSelect = document.getElementById('target-lang');
    const btnRedirect = document.getElementById('btn-redirect');

    btnRedirect.addEventListener('click', () => {
        const text = textInput.value.trim();
        const langPair = langSelect.value; // e.g. "zh/en" or "en/zh"

        let redirectUrl = 'https://www.deepl.com/translator';
        if (text) {
            // Encode twice or clean formatting to prevent DeepL parsing bugs
            redirectUrl += `#${langPair}/${encodeURIComponent(text)}`;
        }

        // Open in new tab
        window.open(redirectUrl, '_blank');
    });
});
