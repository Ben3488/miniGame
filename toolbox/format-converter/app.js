/* ==========================================================================
   Format Converter Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabImage = document.getElementById('tab-image');
    const tabText = document.getElementById('tab-text');
    const imageView = document.getElementById('image-view');
    const textView = document.getElementById('text-view');

    tabImage.addEventListener('click', () => {
        tabImage.classList.add('active');
        tabText.classList.remove('active');
        imageView.classList.add('active');
        textView.classList.remove('active');
    });

    tabText.addEventListener('click', () => {
        tabText.classList.add('active');
        tabImage.classList.remove('active');
        textView.classList.add('active');
        imageView.classList.remove('active');
    });

    // ==========================================================================
    // 📷 Image Converter Logic
    // ==========================================================================
    const uploadZone = document.getElementById('upload-zone');
    const imageInput = document.getElementById('image-input');
    const previewWrapper = document.getElementById('preview-wrapper');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveImage = document.getElementById('btn-remove-image');
    const selectFormat = document.getElementById('select-format');
    const inputQuality = document.getElementById('input-quality');
    const valQuality = document.getElementById('val-quality');
    const btnConvertImage = document.getElementById('btn-convert-image');

    let loadedImageFile = null;

    // Quality slider label
    inputQuality.addEventListener('input', () => {
        valQuality.textContent = inputQuality.value;
    });

    // File input handlers
    uploadZone.addEventListener('click', () => {
        if (!loadedImageFile) imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });

    function handleImageFile(file) {
        loadedImageFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            previewWrapper.classList.remove('hidden');
            btnConvertImage.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Remove image
    btnRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        loadedImageFile = null;
        imageInput.value = '';
        imagePreview.src = '#';
        previewWrapper.classList.add('hidden');
        btnConvertImage.disabled = true;
    });

    // Convert Image
    btnConvertImage.addEventListener('click', () => {
        if (!loadedImageFile) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const format = selectFormat.value;
            const quality = parseFloat(inputQuality.value) / 100;
            
            // Convert to data url
            const convertedDataUrl = canvas.toDataURL(format, quality);

            // Determine download file name
            const origName = loadedImageFile.name.substring(0, loadedImageFile.name.lastIndexOf('.'));
            const extMap = {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/webp': 'webp'
            };
            const extension = extMap[format] || 'png';
            const fileName = `${origName}_converted.${extension}`;

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = convertedDataUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        img.src = imagePreview.src;
    });


    // ==========================================================================
    // 📝 Text & JSON Converter Logic
    // ==========================================================================
    const textInput = document.getElementById('text-input');
    const textOutput = document.getElementById('text-output');
    const btnActionList = document.querySelectorAll('.btn-action');
    const btnCopyText = document.getElementById('btn-copy-text');

    // Safe UTF-8 Base64 Encoding/Decoding helpers
    function utoa(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }
    function atou(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }

    btnActionList.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            const inputVal = textInput.value;

            if (!inputVal) {
                textOutput.value = '';
                return;
            }

            try {
                if (action === 'json-format') {
                    const parsed = JSON.parse(inputVal);
                    textOutput.value = JSON.stringify(parsed, null, 4);
                } else if (action === 'json-minify') {
                    const parsed = JSON.parse(inputVal);
                    textOutput.value = JSON.stringify(parsed);
                } else if (action === 'b64-encode') {
                    textOutput.value = utoa(inputVal);
                } else if (action === 'b64-decode') {
                    textOutput.value = atou(inputVal);
                } else if (action === 'case-upper') {
                    textOutput.value = inputVal.toUpperCase();
                } else if (action === 'case-lower') {
                    textOutput.value = inputVal.toLowerCase();
                }
            } catch (err) {
                textOutput.value = `⚠️ 轉換錯誤：請確認輸入格式是否正確。\n錯誤訊息: ${err.message}`;
            }
        });
    });

    // Copy to clipboard
    btnCopyText.addEventListener('click', () => {
        const outputVal = textOutput.value;
        if (!outputVal) return;

        navigator.clipboard.writeText(outputVal).then(() => {
            const originalText = btnCopyText.textContent;
            btnCopyText.textContent = '🎉 複製成功！';
            btnCopyText.style.background = 'linear-gradient(180deg, #5effa4 0%, #2ddf82 100%)';
            btnCopyText.style.boxShadow = '0 10px 24px rgba(45, 223, 130, 0.3)';

            setTimeout(() => {
                btnCopyText.textContent = originalText;
                btnCopyText.style.background = '';
                btnCopyText.style.boxShadow = '';
            }, 1500);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    });
});
