import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import unquote

# 設定要建立的資料夾名稱
SAVE_DIR = "SanGuoSha_Cards"

# 定義目標維基頁面 (根據你的需求，這裡列出相關的卡牌與擴充包頁面)
# 注意：維基的頁面結構可能會變動，以下為常見的卡牌列表與擴充包頁面
TARGET_URLS = {
    "基本牌與撲克點數": "https://sanguosha.fandom.com/zh/wiki/牌/标准版",
    "神話再臨": "https://sanguosha.fandom.com/zh/wiki/神话再临",
    "界限突破": "https://sanguosha.fandom.com/zh/wiki/界限突破",
    "SP專屬": "https://sanguosha.fandom.com/zh/wiki/SP",
    "錦囊與裝備": "https://sanguosha.fandom.com/zh/wiki/卡牌大全"
}

# 偽裝成瀏覽器，避免被 Fandom 伺服器阻擋
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_image(img_url, folder_name):
    try:
        # Fandom 的圖片 URL 通常包含 /revision/latest... 參數，我們將其清理以獲取原圖
        clean_url = img_url.split('/revision/')[0]
        
        # 從 URL 擷取檔案名稱並解碼 (處理中文檔名)
        file_name = unquote(clean_url.split('/')[-1])
        
        # 確保是圖片檔
        if not (file_name.endswith('.jpg') or file_name.endswith('.png') or file_name.endswith('.webp')):
            return

        file_path = os.path.join(folder_name, file_name)
        
        # 如果檔案已存在則跳過
        if os.path.exists(file_path):
            print(f"[*] 已存在，跳過: {file_name}")
            return

        response = requests.get(clean_url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            with open(file_path, 'wb') as f:
                f.write(response.content)
            print(f"[+] 成功下載: {file_name}")
        else:
            print(f"[-] 下載失敗 (狀態碼 {response.status_code}): {clean_url}")

    except Exception as e:
        print(f"[!] 發生錯誤: {e} - 圖片 URL: {img_url}")

def scrape_wiki_page(category_name, url):
    print(f"\n======================================")
    print(f"開始掃描分類：{category_name}")
    print(f"目標網址：{url}")
    print(f"======================================")
    
    folder_path = os.path.join(SAVE_DIR, category_name)
    create_directory(folder_path)

    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Fandom 網站的高畫質圖片通常包在 <a class="image"> 裡面
        # 尋找所有圖片連結
        image_links = soup.find_all('a', class_='image')
        
        if not image_links:
            print("找不到任何圖片，可能該頁面沒有使用標準的圖片嵌入格式。")
            return

        print(f"找到 {len(image_links)} 張潛在圖片，準備下載...")
        
        for link in image_links:
            img_url = link.get('href')
            if img_url:
                download_image(img_url, folder_path)

    except Exception as e:
        print(f"[!] 無法存取頁面 {url}: {e}")

def main():
    # 建立主資料夾
    create_directory(SAVE_DIR)
    
    # 遍歷所有設定好的目標網址
    for category, url in TARGET_URLS.items():
        scrape_wiki_page(category, url)
        
    print("\n[✔] 所有下載任務執行完畢！圖片已存入", SAVE_DIR, "資料夾中。")

if __name__ == "__main__":
    main()