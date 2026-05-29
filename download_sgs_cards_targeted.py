import os
import sys
import time
import subprocess
import urllib.parse

# 確保控制台支援 UTF-8 輸出 (Windows 常見問題)
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 自動安裝缺少的模組
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


install_dependencies()

import requests
import urllib3
from bs4 import BeautifulSoup

# 關閉 SSL 驗證警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEROES = [
    '曹操', '司馬懿', '夏侯惇', '張遼', '許褚', '郭嘉', '甄姬',
    '劉備', '關羽', '張飛', '諸葛亮', '趙雲', '馬超', '黃月英',
    '孫權', '甘寧', '呂蒙', '周瑜', '陸遜', '孫尚香',
    '呂布', '貂蟬', '華佗', '袁紹', '華雄',
    '界曹操', '界劉備', '界關羽', '界張飛', '界趙雲', '界呂布', '界黃蓋', '界大喬',
    '張角', '荀彧', '魯肅', '左慈', '鄧艾', '姜維', '賈詡',
    '神關羽', '神呂布', '神曹操', '神趙雲',
    'SP趙雲', 'SP貂蟬', '星落'
]

CARDS = [
    '殺', '雷殺', '火殺', '閃', '桃', '酒',
    '過河拆橋', '順手牽羊', '無中生有', '決鬥', '借刀殺人', '五穀豐登', '南蠻入侵', '萬箭齊發', '桃園結義', '無懈可擊', '鐵索連環', '火攻',
    '樂不思蜀', '兵糧寸斷', '閃電',
    '諸葛連弩', '雌雄雙股劍', '青釭劍', '青龍偃月刀', '丈八蛇矛', '貫石斧', '方天畫戟', '麒麟弓', '古錠刀', '朱雀羽扇', '吳六劍', '寒冰劍',
    '八卦陣', '仁王盾', '藤甲', '白銀獅子',
    '木牛流馬',
    '絕影', '的盧', '爪黃飛電', '驊騮', '赤兔', '大宛', '紫騂',
    '銀月槍', '水淹七軍', '兵臨城下', '遠交近攻', '知己知彼', '三尖兩刃刀', '驚帆', '玉龍'
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

BASE_URL = "https://sanguosha.fandom.com/zh/wiki/"

def download_image(name, folder):
    os.makedirs(folder, exist_ok=True)
    # Check both png and jpg to avoid re-downloading
    if os.path.exists(os.path.join(folder, f"{name}.png")) or os.path.exists(os.path.join(folder, f"{name}.jpg")):
        print(f"[{name}] Already exists, skipping.")
        return

    # 正確對中文進行 URL 編碼
    url = BASE_URL + urllib.parse.quote(name)
    try:
        # 加入 verify=False 忽略 SSL 憑證檢查
        res = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        if res.status_code != 200:
            print(f"[{name}] Page not found on Wiki. (HTTP {res.status_code})")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        # find the main image, usually inside a infobox or class "image"
        img_tag = soup.find('a', class_='image')
        if not img_tag:
            print(f"[{name}] No image tag found on the page.")
            return
        
        img_url = img_tag.get('href')
        if not img_url:
            print(f"[{name}] No valid href in image tag.")
            return

        # clean URL
        clean_url = img_url.split('/revision/')[0]
        
        ext = '.png'
        if '.jpg' in clean_url.lower() or '.jpeg' in clean_url.lower(): ext = '.jpg'
        if '.webp' in clean_url.lower(): ext = '.webp'
        
        final_path = os.path.join(folder, f"{name}{ext}")
        
        # 加入 verify=False 忽略 SSL 憑證檢查
        img_res = requests.get(clean_url, headers=HEADERS, timeout=10, verify=False)
        with open(final_path, 'wb') as f:
            f.write(img_res.content)
            
        print(f"[+] Downloaded {name} -> {final_path}")
        time.sleep(0.5)

    except Exception as e:
        print(f"[!] Error downloading {name}: {e}")

def main():
    # 使用相對於腳本本身的絕對路徑，避免執行路徑不同導致找不到資料夾
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, "assets", "SanGuoSha")
    heroes_dir = os.path.join(assets_dir, "heroes_avatar")
    cards_dir = os.path.join(assets_dir, "cards")
    heroes_full_dir = os.path.join(assets_dir, "heroes")

    print(f"將圖片儲存至: {assets_dir}")
    
    print("\n--- 準備下載 武將 ---")
    for h in HEROES:
        download_image(h, heroes_dir)
        # 同時拷貝一份到 heroes 以防前端讀取
        download_image(h, heroes_full_dir)
    
    print("\n--- 準備下載 卡牌 ---")
    for c in CARDS:
        download_image(c, cards_dir)
        
    print("\n[✔] 所有下載任務完成！")
    input("按下 Enter 鍵離開...")

if __name__ == '__main__':
    main()
