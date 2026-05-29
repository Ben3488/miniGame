import os
import sys
import time
import subprocess
import urllib.parse
import urllib.request
import re

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
        print("正在自動安裝模組...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', *missing])

install_dependencies()
import requests
import urllib3
from bs4 import BeautifulSoup
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEROES = [
    '曹操', '司马懿', '夏侯惇', '张辽', '许褚', '郭嘉', '甄姬',
    '刘备', '关羽', '张飞', '诸葛亮', '赵云', '马超', '黄月英',
    '孙权', '甘宁', '吕蒙', '周瑜', '陆逊', '孙尚香',
    '吕布', '貂蝉', '华佗', '袁绍', '华雄',
    '界曹操', '界刘备', '界关羽', '界张飞', '界赵云', '界吕布', '界黄盖', '界大乔',
    '张角', '荀彧', '鲁肃', '左慈', '邓艾', '姜维', '贾诩',
    '神关羽', '神吕布', '神曹操', '神赵云',
    'SP赵云', 'SP貂蝉', '星落'
]

CARDS = [
    '杀', '雷杀', '火杀', '闪', '桃', '酒',
    '过河拆桥', '顺手牵羊', '无中生有', '决斗', '借刀杀人', '五谷丰登', '南蛮入侵', '万箭齐发', '桃园结义', '无懈可击', '铁索连环', '火攻',
    '乐不思蜀', '兵粮寸断', '闪电',
    '诸葛连弩', '雌雄双股剑', '青釭剑', '青龙偃月刀', '丈八蛇矛', '贯石斧', '方天画戟', '麒麟弓', '古锭刀', '朱雀羽扇', '吴六剑', '寒冰剑',
    '八卦阵', '仁王盾', '藤甲', '白银狮子',
    '木牛流马',
    '绝影', '的卢', '爪黄飞电', '骅骝', '赤兔', '大宛', '紫骍',
    '银月枪', '水淹七军', '兵临城下', '远交近攻', '知己知彼', '三尖两刃刀', '惊帆', '玉龙'
]

TRAD_MAP = {
    '司马懿': '司馬懿', '张辽': '張遼', '许褚': '許褚', '刘备': '劉備', '关羽': '關羽', '张飞': '張飛', '诸葛亮': '諸葛亮',
    '赵云': '趙雲', '马超': '馬超', '黄月英': '黃月英', '孙权': '孫權', '甘宁': '甘寧', '吕蒙': '呂蒙', '陆逊': '陸遜',
    '孙尚香': '孫尚香', '吕布': '呂布', '貂蝉': '貂蟬', '华佗': '華佗', '袁绍': '袁紹', '华雄': '華雄',
    '界刘备': '界劉備', '界关羽': '界關羽', '界张飞': '界張飛', '界赵云': '界趙雲', '界吕布': '界呂布', '界黄盖': '界黃蓋', '界大乔': '界大喬',
    '张角': '張角', '荀彧': '荀彧', '鲁肃': '魯肅', '邓艾': '鄧艾', '姜维': '姜維', '贾诩': '賈詡',
    '神关羽': '神關羽', '神吕布': '神吕布', '神曹操': '神曹操', '神赵云': '神趙雲', 'SP赵云': 'SP趙雲', 'SP貂蝉': 'SP貂蟬',
    '杀': '殺', '雷杀': '雷殺', '火杀': '火殺', '闪': '閃',
    '过河拆桥': '過河拆橋', '顺手牵羊': '順手牽羊', '无中生有': '無中生有', '决斗': '決鬥', '借刀杀人': '借刀殺人',
    '五谷丰登': '五穀豐登', '南蛮入侵': '南蠻入侵', '万箭齐发': '萬箭齊發', '桃园结义': '桃園結義', '无懈可击': '無懈可擊', '铁索连环': '鐵索連環',
    '乐不思蜀': '樂不思蜀', '兵粮寸断': '兵糧寸斷', '闪电': '閃電',
    '诸葛连弩': '諸葛連弩', '雌雄双股剑': '雌雄雙股劍', '青釭剑': '青釭劍', '青龙偃月刀': '青龍偃月刀', '丈八蛇矛': '丈八蛇矛',
    '贯石斧': '貫石斧', '方天画戟': '方天畫戟', '麒麟弓': '麒麟弓', '古锭刀': '古錠刀', '朱雀羽扇': '朱雀羽扇',
    '吴六剑': '吳六劍', '寒冰剑': '寒冰劍', '八卦阵': '八卦陣', '仁王盾': '仁王盾', '白银狮子': '白銀獅子', '木牛流马': '木牛流馬',
    '绝影': '絕影', '的卢': '的盧', '爪黄飞电': '爪黃飛電', '骅骝': '驊騮', '紫骍': '紫騂', '银月枪': '銀月槍',
    '水淹七军': '水淹七軍', '兵临城下': '兵臨城下', '远交近攻': '遠交近攻', '知己知彼': '知己知彼',
    '三尖两刃刀': '三尖兩刃刀', '惊帆': '驚帆', '玉龙': '玉龍'
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
}

def get_trad_name(simp_name):
    return TRAD_MAP.get(simp_name, simp_name)

def extract_image_from_page(url, name):
    try:
        res = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # 優先找 infobox 裡面的圖片
            infobox = soup.find(class_='portable-infobox')
            if infobox:
                img_tag = infobox.find('a', class_='image')
                if img_tag and img_tag.get('href'):
                    return img_tag.get('href').split('/revision/')[0]
            
            # 若沒有 infobox，找頁面第一張 <a class="image">
            for a_tag in soup.find_all('a', class_='image'):
                href = a_tag.get('href', '')
                if 'File:' in href or '.png' in href or '.jpg' in href:
                    return href.split('/revision/')[0]
    except Exception as e:
        print(f"嘗試抓取 {url} 失敗: {e}")
    return None

def download_item(name, folder):
    trad_name = get_trad_name(name)
    os.makedirs(folder, exist_ok=True)
    if os.path.exists(os.path.join(folder, f"{trad_name}.png")) or os.path.exists(os.path.join(folder, f"{trad_name}.jpg")):
        print(f"[{trad_name}] Already exists.")
        return

    # 直接訪問該項目的 Wiki 專屬頁面 (這正是您提出的精準搜尋方式)
    urls_to_try = [
        f"https://sanguosha.fandom.com/zh/wiki/{urllib.parse.quote(name)}",
        f"https://sanguosha.fandom.com/zh/wiki/{urllib.parse.quote(trad_name)}"
    ]
    
    img_url = None
    for url in urls_to_try:
        img_url = extract_image_from_page(url, trad_name)
        if img_url:
            break
            
    if not img_url:
        print(f"[!] {trad_name} - 在百科專屬頁面上找不到圖片。")
        return
        
    ext = '.png'
    if '.jpg' in img_url.lower() or '.jpeg' in img_url.lower(): ext = '.jpg'
    if '.webp' in img_url.lower(): ext = '.webp'
    
    final_path = os.path.join(folder, f"{trad_name}{ext}")
    
    try:
        img_res = requests.get(img_url, headers=HEADERS, timeout=10, verify=False)
        with open(final_path, 'wb') as f:
            f.write(img_res.content)
        print(f"[+] 成功下載: {trad_name}")
        time.sleep(0.3)
    except Exception as e:
        print(f"[!] 下載 {trad_name} 圖片檔案時失敗: {e}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, "assets", "SanGuoSha")
    heroes_dir = os.path.join(assets_dir, "heroes_avatar")
    cards_dir = os.path.join(assets_dir, "cards")

    print(f"將圖片儲存至: {assets_dir}")
    print("\n--- 準備下載 武將 ---")
    for h in HEROES:
        download_item(h, heroes_dir)
        download_item(h, os.path.join(assets_dir, "heroes"))
    
    print("\n--- 準備下載 卡牌 ---")
    for c in CARDS:
        download_item(c, cards_dir)
        
    print("\n[✔] 所有下載任務完成！")
    input("按下 Enter 鍵離開...")

if __name__ == '__main__':
    main()
