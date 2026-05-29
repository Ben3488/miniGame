import os
import sys
import re
import json
import urllib.parse
import time
import subprocess

# 確保控制台支援 UTF-8 輸出
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def install_dependencies():
    missing = []
    try:
        import requests
    except ImportError:
        missing.append('requests')
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        missing.append('beautifulsoup4')
        
    if missing:
        print(f"正在自動安裝缺少的模組: {', '.join(missing)}...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', *missing])
        print("模組安裝完成！\n")

# 在開頭先確保依賴已安裝
install_dependencies()

import requests
from bs4 import BeautifulSoup
import urllib3

# 關閉 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def update_js_script(bg_dir):
    js_path = os.path.join(bg_dir, "random_bg.js")
    
    if not os.path.exists(js_path):
        print(f"找不到 random_bg.js ({js_path})，跳過更新程式碼。")
        return
        
    # 讀取資料夾內所有的背景圖片
    bg_files = []
    for f in os.listdir(bg_dir):
        if f.startswith("board_bg") and f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            bg_files.append(f"        '../assets/SanGuoSha/backgrounds/{f}'")
            
    # 建立新的陣列字串
    bg_array_str = "    const bgs = [\n" + ",\n".join(bg_files) + "\n    ];"
    
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 用正則表達式取代原有的 bgs 陣列
    new_content = re.sub(r'const\s+bgs\s*=\s*\[.*?\];', bg_array_str, content, flags=re.DOTALL)
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"[✔] 已經自動將 {len(bg_files)} 張背景圖更新到 random_bg.js 中，遊戲程式碼已經可以抓到新圖片了！")

def main():
    # 路徑設定
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    bg_dir = os.path.join(project_dir, "assets", "SanGuoSha", "backgrounds")
    
    os.makedirs(bg_dir, exist_ok=True)
    
    keyword = "三國遊戲背景 高清"
    max_images = 5 # 預設抓取 5 張
    
    print(f"將圖片儲存至: {bg_dir}")
    print(f"搜尋關鍵字: {keyword}")
    
    # 找出目前資料夾中編號最大的 board_bgX.png
    max_x = 0
    for f in os.listdir(bg_dir):
        match = re.search(r'board_bg(\d+)\.(png|jpg|jpeg|webp)', f, re.IGNORECASE)
        if match:
            max_x = max(max_x, int(match.group(1)))
            
    current_x = max_x + 1
    # 如果找不到數字，但存在 board_bg.png，從 2 開始
    if current_x == 1 and any(f.startswith("board_bg") for f in os.listdir(bg_dir)):
        current_x = 2
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    }
    
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(keyword)}&form=HDRSC2&first=1"
    
    print("\n--- 開始搜尋並下載背景圖 ---")
    try:
        res = requests.get(url, headers=headers, timeout=10, verify=False)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        count = 0
        # Bing 的圖片搜尋結果都在 a class="iusc" 的標籤裡
        for a in soup.find_all('a', class_='iusc'):
            if count >= max_images:
                break
            try:
                m_data = json.loads(a.get('m', '{}'))
                murl = m_data.get('murl')
                if not murl:
                    continue
                    
                print(f"正在下載 [{current_x}]: {murl[:60]}...")
                
                # 下載圖片
                img_res = requests.get(murl, headers=headers, timeout=15, verify=False)
                if img_res.status_code == 200:
                    # 決定副檔名
                    ext = '.png'
                    if '.jpg' in murl.lower() or '.jpeg' in murl.lower(): ext = '.jpg'
                    elif '.webp' in murl.lower(): ext = '.webp'
                        
                    filename = f"board_bg{current_x}{ext}"
                    filepath = os.path.join(bg_dir, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(img_res.content)
                        
                    print(f" -> 成功儲存為 {filename}")
                    current_x += 1
                    count += 1
                    time.sleep(0.5)
                else:
                    print(f" -> 伺服器拒絕存取 (HTTP {img_res.status_code})")
            except Exception as e:
                print(f" -> 下載失敗: {e}")
                
        print(f"\n[✔] 總共成功下載了 {count} 張高解析度背景圖！")
        
        print("\n--- 更新隨機背景腳本 ---")
        update_js_script(bg_dir)
        
    except Exception as e:
        print(f"搜尋過程中發生錯誤: {e}")

    print("\n完成！")

if __name__ == "__main__":
    main()
