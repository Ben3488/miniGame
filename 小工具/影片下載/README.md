# TubeFlow - 現代化 YouTube 影片與音訊下載器

TubeFlow 是一個高質感、免伺服器運作、基於純前端技術與 Cobalt API 的 YouTube 媒體下載程式。

## 特色功能 (Features)

1. **極致現代美學**：採用極簡毛玻璃暗黑風格 (Glassmorphism)，具備豐富的漸層背景、微互動動畫及完整的響應式排版，完美支援手機與桌面瀏覽器。
2. **免安裝、免伺服器**：採用純前端 HTML/CSS/JS 開發，不需安裝任何 Node.js 或 Python 後端，直接開箱即可雙擊使用。
3. **多伺服器自動延遲測試 (Auto-Ping)**：網頁啟動時，自動向內建的多個公共 Cobalt 下載節點發送輕量級請求，計算延遲時間，並自動將下載導向反應最快的可用伺服器。
4. **精準 YouTube 中繼資料抓取**：貼入 YouTube 影片或 Shorts 連結時，程式自動使用免憑證的 YouTube oEmbed API 獲取影片的真實標題與高畫質縮圖，提升使用體驗。
5. **完整下載選項**：支援下載 MP4 影片（最高畫質、1080p、720p 等）或純音訊（MP3、M4A、WAV 等）格式。
6. **歷史記錄管理**：使用 `localStorage` 在瀏覽器本地記錄使用者的下載歷程，包含縮圖、標題及下載連結，方便再次快速開啟，且具備清空與單筆管理功能。
7. **進階自訂節點**：支援自訂私有 Cobalt API 伺服器，對抗公共節點失效或流量限制。

## 目錄結構 (Project Architecture)

```text
├── index.html   # 主網頁架構與配置
├── style.css    # 現代化 CSS 毛玻璃樣式系統與動畫
├── app.js       # 核心 JavaScript 應用程式邏輯與 API 通訊
└── README.md    # 說明文件與部署指南
```

## 使用方法 (How to Use)

1. 在檔案總管中雙擊 `index.html` 即可在預設瀏覽器中開啟程式。
2. 在輸入框中貼入 YouTube 影片網址（如 `https://www.youtube.com/watch?v=dQw4w9WgXcQ`）。
3. 調整所需的模式（影片/音訊）與品質選項。
4. 點選 **「開始解析」**，等待解析完成。
5. 解析成功後，點選 **「立即下載檔案」** 按鈕。
   * *注意：若點選後影片直接在瀏覽器中播放，請在影片畫面上按滑鼠右鍵並選擇「另存影片」或「另存音訊」即可保存至電腦。*

---

## 進階：自建 Cobalt API 下載節點 (Docker Deployment Guide)

若您想獲得更穩定、無限制且專屬的下載體驗，建議自行部署 Cobalt 下載伺服器：

### 1. 安裝 Docker 與 Docker Compose
請確保您的系統上已安裝 [Docker](https://www.docker.com/)。

### 2. 建立 `docker-compose.yml`
建立一個資料夾並在其中建立 `docker-compose.yml` 檔案，內容如下：

```yaml
version: '3.8'

services:
  cobalt-api:
    image: ghcr.io/imputnet/cobalt:latest
    container_name: cobalt-api
    restart: always
    ports:
      - "9000:9000"
    environment:
      # 設定網頁存取，使用 * 代表允許所有網域跨網域存取 (CORS)
      - API_URL=http://localhost:9000/
      # 限制只下載部分網站的檔案 (選填)
      - COOKIE_PATH=/path/to/cookies.json # 用於特定網站
```

### 3. 啟動服務
於該目錄下執行以下指令啟動伺服器：
```bash
docker compose up -d
```

### 4. 設定 TubeFlow 串接
1. 開啟本程式的網頁。
2. 點選下載節點旁的 **「齒輪設定」** 按鈕。
3. 在自訂端點中填入 `http://localhost:9000/` 並儲存。
4. 之後程式便會透過您專屬的本地伺服器以極速下載影片！
