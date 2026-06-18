/* ==========================================================================
   自媒體 AI 助手 Redirector Logic Script (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainTabs = document.querySelectorAll('.main-tabs .tab-btn');
    const platformGroups = document.querySelectorAll('.platform-group');
    const templatesLabel = document.getElementById('templates-label');
    const templatesContainer = document.getElementById('templates-container');
    const promptLabel = document.getElementById('prompt-label');
    const promptInput = document.getElementById('prompt-text');
    const btnRedirect = document.getElementById('btn-redirect');
    const toast = document.getElementById('toast-notify');

    let currentTargetUrl = '';
    let currentPlatformName = '';

    // Configuration Data for Tabs
    const contentConfig = {
        video: {
            templatesLabel: "💡 影片分析常用範本",
            promptLabel: "📝 您的 AI Prompt / 影片連結",
            placeholder: "請在此處貼上 YouTube/Bilibili 影片連結，並選擇上方範本或直接編輯 Prompt 內容...",
            templates: [
                {
                    title: "🎬 影片精簡大綱",
                    prompt: "請幫我將這部影片的主要內容整理成一份清晰的大綱，列出各段時間戳記的重點摘要。影片連結："
                },
                {
                    title: "✍️ 逐字稿修飾優化",
                    prompt: "以下是影片的語意辨識逐字稿，請幫我修正錯字、通順語意，並分段加上引人入勝的小標題：\n\n[在此貼上逐字稿]"
                },
                {
                    title: "📢 社群推廣貼文",
                    prompt: "請根據這部影片的內容，寫一篇吸引人的社群推廣貼文（例如 Facebook / Threads），包含點睛的標題、精華要點與 Hashtags。影片連結："
                },
                {
                    title: "❓ 影片焦點問答",
                    prompt: "我想深入了解這部影片中有關 [輸入核心主題] 的討論，請幫我詳細說明影片中對此的觀點與論述。影片連結："
                }
            ]
        },
        ppt: {
            templatesLabel: "💡 簡報 PPT 常用範本",
            promptLabel: "📝 您的 AI Prompt / 簡報大綱",
            placeholder: "輸入您的簡報主題，並選擇上方範本或自行編輯以生成精美簡報大綱...",
            templates: [
                {
                    title: "💼 商業計畫書 PPT",
                    prompt: "請幫我生成一份『[產品名稱] 商業計畫書』的 PPT 大綱。結構包含：市場痛點、核心解決方案、商業模式、行銷與推廣策略、財務預測。"
                },
                {
                    title: "🎓 教學培訓簡報",
                    prompt: "請為『[教學主題]』設計一份 10 頁的培訓課件大綱，結構需包含：前言導入、核心觀念拆解、案例分析、小組互動問答與總結。"
                },
                {
                    title: "📊 專案進度匯報",
                    prompt: "請幫我草擬一份本季度專案進度報告的簡報大綱，內容包含：專案目標回顧、已達成里程碑、遭遇挑戰與解決方案、下階段規劃。"
                },
                {
                    title: "📄 Markdown 格式",
                    prompt: "請將以下內容轉換為適合 MindShow 的 Markdown 格式簡報草稿，使用 # 表示投影片標題，## 表示要點內容：\n\n主題：[簡報主題]\n核心要點：[列出要點]"
                }
            ]
        },
        tts: {
            templatesLabel: "💡 文字轉語音 (TTS) 旁白範本",
            promptLabel: "📝 您的配音文字內容",
            placeholder: "在此輸入您想轉為語音的文字，可直接套用下方範本加以修改...",
            templates: [
                {
                    title: "🧠 知識科普旁白",
                    prompt: "大家好！歡迎收看今天的科普頻道。你是否想過，為什麼[主題]會這樣呢？今天我們就用三分鐘的時間，一起揭開這個奧秘..."
                },
                {
                    title: "📖 故事說書口吻",
                    prompt: "在很久很久以前，有一座被迷霧籠罩的古老森林。傳說，每當深夜月圓之時，森林深處就會傳來一陣奇妙的琴聲..."
                },
                {
                    title: "⚡ 短影音黃金開頭",
                    prompt: "千萬別再這樣做了！90% 的人都不知道的[主題]冷知識，今天一次告訴你！記得先按讚收藏，免得以後找不到！"
                },
                {
                    title: "📣 產品廣告配音",
                    prompt: "想要事半功倍？全新[產品名稱]現已震撼登場！極致體驗，智慧生活，立即點擊下方連結，開啟您的升級之旅！"
                }
            ]
        },
        creative: {
            templatesLabel: "💡 自媒體常用 AI 提示詞",
            promptLabel: "📝 您的 AI Prompt / 靈感草稿",
            placeholder: "在下方選擇 Midjourney 提示詞、標題產生器或腳本大綱，一鍵複製並使用...",
            templates: [
                {
                    title: "🎨 Midjourney 畫作",
                    prompt: "A highly detailed cinematic shot of [主體], cyberpunk aesthetic, glowing neon lights, 8k resolution, photorealistic, shot on 35mm lens, --ar 16:9 --v 6.0"
                },
                {
                    title: "🔥 爆款標題產生器",
                    prompt: "請為關於『[文章或影片主題]』的內容，生成 5 個符合自媒體風格（好奇心、情緒共鳴、數字法則）的爆款標題。"
                },
                {
                    title: "🎬 60秒短影音腳本",
                    prompt: "請幫我寫一份 60 秒短影音的腳本，主題是『[影片主題]』。結構包含：0-5秒黃金開頭吸睛、5-40秒痛點與乾貨分享、40-60秒行動呼籲。"
                },
                {
                    title: "🎵 Suno 歌詞生成",
                    prompt: "[Verse 1]\n在深夜的街角 霓虹在閃爍\n吉他的聲音 訴說著寂寞\n\n[Chorus]\n奔跑吧 迎著風 追尋那道光\n\n[Style: Synthwave, male voice, fast tempo]"
                }
            ]
        }
    };

    // Initialize the module with 'video' tab
    switchMainTab('video');

    // Tab Switch click handlers
    mainTabs.forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const targetTab = tabBtn.getAttribute('data-tab');
            mainTabs.forEach(btn => btn.classList.remove('active'));
            tabBtn.classList.add('active');
            switchMainTab(targetTab);
        });
    });

    // Function to switch main categories
    function switchMainTab(tabName) {
        // 1. Show the correct platform group
        platformGroups.forEach(group => {
            if (group.id === `platforms-${tabName}`) {
                group.classList.remove('hidden');
                // Auto select the first platform button in the group
                const firstBtn = group.querySelector('.platform-btn');
                if (firstBtn) {
                    selectPlatform(firstBtn, group);
                }
            } else {
                group.classList.add('hidden');
            }
        });

        // 2. Bind click handlers to the now active platforms in this group
        const activeGroup = document.getElementById(`platforms-${tabName}`);
        if (activeGroup) {
            const platformBtns = activeGroup.querySelectorAll('.platform-btn');
            platformBtns.forEach(btn => {
                // Remove existing click handlers if any (re-binding)
                btn.onclick = null;
                btn.onclick = () => selectPlatform(btn, activeGroup);
            });
        }

        // 3. Update Text labels, placeholder, and templates
        const config = contentConfig[tabName];
        if (config) {
            templatesLabel.textContent = config.templatesLabel;
            promptLabel.textContent = config.promptLabel;
            promptInput.placeholder = config.placeholder;
            promptInput.value = ''; // Reset input text

            // Render template buttons
            templatesContainer.innerHTML = '';
            config.templates.forEach(tpl => {
                const btn = document.createElement('button');
                btn.className = 'btn-template';
                btn.textContent = tpl.title;
                btn.addEventListener('click', () => {
                    promptInput.value = tpl.prompt;
                    promptInput.focus();
                });
                templatesContainer.appendChild(btn);
            });
        }
    }

    // Function to select platform within the active category
    function selectPlatform(btnElement, groupContainer) {
        const platformBtns = groupContainer.querySelectorAll('.platform-btn');
        platformBtns.forEach(btn => btn.classList.remove('active'));
        
        btnElement.classList.add('active');
        currentTargetUrl = btnElement.getAttribute('data-url');
        currentPlatformName = btnElement.getAttribute('data-platform');
        
        // Update redirect button text to include platform name
        btnRedirect.innerHTML = `⚡ 複製內容並開啟 ${currentPlatformName}`;
    }

    // Copy Content & Redirect handler
    btnRedirect.addEventListener('click', () => {
        const textContent = promptInput.value.trim();

        if (textContent) {
            // Write to Clipboard
            navigator.clipboard.writeText(textContent).then(() => {
                showToastAndRedirect();
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                // Fail-safe: Redirect directly
                window.open(currentTargetUrl, '_blank');
            });
        } else {
            // Textarea is empty, just open platform
            window.open(currentTargetUrl, '_blank');
        }
    });

    // Toast and open link logic
    function showToastAndRedirect() {
        toast.textContent = `🎉 內容已成功複製！正在前往 ${currentPlatformName}...`;
        toast.classList.remove('hidden');

        // Delay redirect slightly to show Toast
        setTimeout(() => {
            window.open(currentTargetUrl, '_blank');
        }, 800);

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
