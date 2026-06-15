/* ==========================================================================
   URL Shortener & QR Generator Logic (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const longUrlInput = document.getElementById('long-url');
    const btnClearUrl = document.getElementById('btn-clear-url');
    const btnShorten = document.getElementById('btn-shorten');
    const spinner = document.getElementById('loading-spinner');
    const resultLayout = document.getElementById('result-layout');
    
    const shortUrlOut = document.getElementById('short-url-out');
    const btnCopyUrl = document.getElementById('btn-copy-url');
    const linkVisit = document.getElementById('link-visit');
    
    const qrCanvas = document.getElementById('qr-canvas');
    const qrTargetSelect = document.getElementById('qr-target');
    const colorFgInput = document.getElementById('color-fg');
    const colorBgInput = document.getElementById('color-bg');
    const btnDownloadQr = document.getElementById('btn-download-qr');

    let currentShortUrl = '';
    let currentLongUrl = '';
    let qrGenerator = null;

    // Show/hide clear button
    longUrlInput.addEventListener('input', () => {
        if (longUrlInput.value.trim().length > 0) {
            btnClearUrl.style.display = 'flex';
        } else {
            btnClearUrl.style.display = 'none';
        }
    });

    btnClearUrl.addEventListener('click', () => {
        longUrlInput.value = '';
        btnClearUrl.style.display = 'none';
        longUrlInput.focus();
    });

    // Shorten action
    btnShorten.addEventListener('click', () => {
        let longUrl = longUrlInput.value.trim();
        if (!longUrl) return;

        // Basic URL validation & protocol auto-append
        if (!/^https?:\/\//i.test(longUrl)) {
            longUrl = 'http://' + longUrl;
            longUrlInput.value = longUrl;
        }

        try {
            new URL(longUrl); // Verify if it's a parseable URL
        } catch (_) {
            alert('請輸入有效的網址格式！');
            return;
        }

        currentLongUrl = longUrl;
        resultLayout.classList.add('hidden');
        spinner.classList.remove('hidden');

        // Shorten using JSONP with is.gd API
        shortenUrlJSONP(longUrl)
            .then(shortUrl => {
                currentShortUrl = shortUrl;
                displayResults(shortUrl);
            })
            .catch(err => {
                console.warn('Shortener service fallback active:', err);
                // Fallback: Use a mock or just the original URL and notify user
                const fallbackHash = Math.random().toString(36).substring(2, 8);
                currentShortUrl = `https://is.gd/mock_${fallbackHash}`;
                alert('提示：目前無法與短網址伺服器連線（可能是離線或 API 速率限制），已為您生成模擬短網址。QR 碼依然可以正常運作喔！');
                displayResults(currentShortUrl);
            })
            .finally(() => {
                spinner.classList.add('hidden');
            });
    });

    // Helper: JSONP request to is.gd
    function shortenUrlJSONP(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'isGd_' + Math.floor(Math.random() * 1000000);
            const scriptUrl = `https://is.gd/create.php?format=json&callback=${callbackName}&url=${encodeURIComponent(url)}`;
            
            // Timeout rejection
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP Request Timeout'));
            }, 6000);

            function cleanup() {
                clearTimeout(timeoutId);
                const scriptEl = document.getElementById(callbackName);
                if (scriptEl) scriptEl.remove();
                delete window[callbackName];
            }

            // Define global callback handler
            window[callbackName] = (data) => {
                cleanup();
                if (data && data.shorturl) {
                    resolve(data.shorturl);
                } else if (data && data.errormessage) {
                    reject(new Error(data.errormessage));
                } else {
                    reject(new Error('Unknown response structure'));
                }
            };

            // Inject script tag
            const script = document.createElement('script');
            script.id = callbackName;
            script.src = scriptUrl;
            script.onerror = () => {
                cleanup();
                reject(new Error('Script load failed'));
            };
            document.body.appendChild(script);
        });
    }

    // Display result layout
    function displayResults(shortUrl) {
        shortUrlOut.value = shortUrl;
        linkVisit.href = shortUrl;
        
        resultLayout.classList.remove('hidden');

        // Generate QR code
        generateQRCode();
    }

    // Generate/Redraw QR Code using QRious
    function generateQRCode() {
        if (typeof QRious === 'undefined') {
            console.error('QRious library is not loaded');
            return;
        }

        const qrValue = qrTargetSelect.value === 'short' ? currentShortUrl : currentLongUrl;
        const colorFg = colorFgInput.value || '#0f172a';
        const colorBg = colorBgInput.value || '#ffffff';

        qrGenerator = new QRious({
            element: qrCanvas,
            value: qrValue,
            size: 200,
            foreground: colorFg,
            background: colorBg,
            level: 'H' // High error correction
        });
    }

    // Interactive customization events
    qrTargetSelect.addEventListener('change', generateQRCode);
    colorFgInput.addEventListener('input', generateQRCode);
    colorBgInput.addEventListener('input', generateQRCode);

    // Copy shortened URL
    btnCopyUrl.addEventListener('click', () => {
        const text = shortUrlOut.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = btnCopyUrl.textContent;
            btnCopyUrl.textContent = '🎉 已複製！';
            btnCopyUrl.style.background = 'linear-gradient(180deg, #5effa4 0%, #2ddf82 100%)';
            btnCopyUrl.style.color = '#0c1223';
            btnCopyUrl.style.borderColor = 'transparent';

            setTimeout(() => {
                btnCopyUrl.textContent = originalText;
                btnCopyUrl.style.background = '';
                btnCopyUrl.style.color = '';
                btnCopyUrl.style.borderColor = '';
            }, 1500);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    });

    // Download QR Code image
    btnDownloadQr.addEventListener('click', () => {
        if (!qrCanvas) return;

        const dataUrl = qrCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        
        // Dynamic file name
        const prefix = qrTargetSelect.value === 'short' ? 'short' : 'original';
        link.download = `qrcode_${prefix}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
