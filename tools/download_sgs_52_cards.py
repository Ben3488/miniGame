import os
import sys
import time
import subprocess
import urllib.parse
import urllib.request
import ssl

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
    try:
        from PIL import Image
    except ImportError:
        missing.append('Pillow')

    if missing:
        print(f"正在自動安裝缺少的手件/套件: {', '.join(missing)}...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', *missing])
            print("安裝成功！\n")
        except Exception as e:
            print(f"安裝套件失敗，請手動執行 'pip install requests beautifulsoup4 Pillow'。錯誤: {e}")
            sys.exit(1)

install_dependencies()

import requests
import urllib3
from bs4 import BeautifulSoup
from PIL import Image
import io

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# HTTP Headers for crawling Fandom
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
}

# Mapping of Chinese card names to English/Pinyin identifiers in Noname GitHub
CARD_KEYS = {
    '殺': 'sha',
    '雷殺': 'sha_thunder',
    '火殺': 'sha_fire',
    '閃': 'shan',
    '桃': 'tao',
    '酒': 'jiu',
    '過河拆橋': 'guohe',
    '順手牽羊': 'shunshou',
    '無中生有': 'wuzhong',
    '決鬥': 'juedou',
    '借刀殺人': 'jiedao',
    '五穀豐登': 'wugu',
    '南蠻入侵': 'nanman',
    '萬箭齊發': 'wanjian',
    '桃園結義': 'taoyuan',
    '無懈可擊': 'wuxie',
    '鐵索連環': 'tiesuo',
    '火攻': 'huogong',
    '樂不思蜀': 'lebu',
    '兵糧寸斷': 'bingliang',
    '閃電': 'shandian',
    '諸葛連弩': 'zhuge',
    '雌雄雙股劍': 'shuanggu',
    '青釭劍': 'qinggang',
    '青龍偃月刀': 'qinglong',
    '丈八蛇矛': 'zhangba',
    '貫石斧': 'guanshi',
    '方天畫戟': 'fangtian',
    '麒麟弓': 'qilin',
    '古錠刀': 'guding',
    '朱雀羽扇': 'zhuque',
    '吳六劍': 'wuliu',
    '寒冰劍': 'hanbing',
    '八卦陣': 'bagua',
    '仁王盾': 'renwang',
    '藤甲': 'tengjia',
    '白銀獅子': 'baiyin',
    '木牛流馬': 'muniu',
    '絕影': 'jueying',
    '的盧': 'dilu',
    '爪黃飛電': 'zhuahuang',
    '驊騮': 'hualiu',
    '赤兔': 'chitu',
    '大宛': 'dawan',
    '紫騂': 'zixin',
    '銀月槍': 'yinyue',
    '水淹七軍': 'shuiyan',
    '兵臨城下': 'binglin',
    '遠交近攻': 'yuanjiao',
    '知己知彼': 'zhiji',
    '三尖兩刃刀': 'sanjian',
    '驚帆': 'jingfan',
    '玉龍': 'yulong'
}

# English names for filenames
CARD_FILENAMES = {
    '殺': 'sha', '雷殺': 'thunder_sha', '火殺': 'fire_sha', '閃': 'shan', '桃': 'tao', '酒': 'jiu',
    '過河拆橋': 'dismantle', '順手牽羊': 'snatch', '無中生有': 'ex_nihilo', '決鬥': 'duel',
    '借刀殺人': 'borrow_sword', '五穀豐登': 'harvest', '南蠻入侵': 'barbarian', '萬箭齊發': 'arrows',
    '桃園結義': 'peach_garden', '無懈可擊': 'flawless', '鐵索連環': 'iron_shackles', '火攻': 'fire_attack',
    '樂不思蜀': 'indulgence', '兵糧寸斷': 'supply_shortage', '閃電': 'lightning',
    '諸葛連弩': 'crossbow', '雌雄雙股劍': 'double_swords', '青釭劍': 'qinggang_sword',
    '青龍偃月刀': 'green_dragon_crescent_blade', '丈八蛇矛': 'serpent_spear', '貫石斧': 'stone_cleaving_axe',
    '方天畫戟': 'fangtian_halberd', '麒麟弓': 'kirin_bow', '古錠刀': 'guding_blade',
    '朱雀羽扇': 'feather_fan', '吳六劍': 'wu_six_swords', '寒冰劍': 'ice_sword',
    '八卦陣': 'eight_diagrams', '仁王盾': 'renwang_shield', '藤甲': 'rattan_armor',
    '白銀獅子': 'silver_lion', '木牛流馬': 'wooden_ox',
    '絕影': 'shadow_runner', '的盧': 'dilu', '爪黃飛電': 'yellow_lightning', '驊騮': 'hualiu',
    '赤兔': 'red_hare', '大宛': 'dawan', '紫騂': 'zixin',
    '銀月槍': 'silver_moon_spear', '水淹七軍': 'drowning', '兵臨城下': 'city_under_siege',
    '遠交近攻': 'allies_and_enemies', '知己知彼': 'know_self_and_enemy',
    '三尖兩刃刀': 'three_point_double_edge_blade', '驚帆': 'jingfan', '玉龍': 'yulong'
}

# The 52 Military Dispute cards (神話再臨·軍爭篇)
MILITARY_CARDS_LIST = [
    # Spade (♠)
    {'suit': 'spade', 'point': 'A', 'name': '古錠刀'},
    {'suit': 'spade', 'point': '2', 'name': '藤甲'},
    {'suit': 'spade', 'point': '3', 'name': '酒'},
    {'suit': 'spade', 'point': '4', 'name': '雷殺'},
    {'suit': 'spade', 'point': '5', 'name': '雷殺'},
    {'suit': 'spade', 'point': '6', 'name': '雷殺'},
    {'suit': 'spade', 'point': '7', 'name': '雷殺'},
    {'suit': 'spade', 'point': '8', 'name': '雷殺'},
    {'suit': 'spade', 'point': '9', 'name': '酒'},
    {'suit': 'spade', 'point': '10', 'name': '兵糧寸斷'},
    {'suit': 'spade', 'point': 'J', 'name': '鐵索連環'},
    {'suit': 'spade', 'point': 'Q', 'name': '鐵索連環'},
    {'suit': 'spade', 'point': 'K', 'name': '驊騮'},

    # Heart (♥)
    {'suit': 'heart', 'point': 'A', 'name': '無懈可擊'},
    {'suit': 'heart', 'point': '2', 'name': '火攻'},
    {'suit': 'heart', 'point': '3', 'name': '火攻'},
    {'suit': 'heart', 'point': '4', 'name': '火殺'},
    {'suit': 'heart', 'point': '5', 'name': '桃'},
    {'suit': 'heart', 'point': '6', 'name': '桃'},
    {'suit': 'heart', 'point': '7', 'name': '火殺'},
    {'suit': 'heart', 'point': '8', 'name': '閃'},
    {'suit': 'heart', 'point': '9', 'name': '閃'},
    {'suit': 'heart', 'point': '10', 'name': '火殺'},
    {'suit': 'heart', 'point': 'J', 'name': '閃'},
    {'suit': 'heart', 'point': 'Q', 'name': '閃'},
    {'suit': 'heart', 'point': 'K', 'name': '無懈可擊'},

    # Club (♣)
    {'suit': 'club', 'point': 'A', 'name': '白銀獅子'},
    {'suit': 'club', 'point': '2', 'name': '木牛流馬'},
    {'suit': 'club', 'point': '3', 'name': '酒'},
    {'suit': 'club', 'point': '4', 'name': '兵糧寸斷'},
    {'suit': 'club', 'point': '5', 'name': '雷殺'},
    {'suit': 'club', 'point': '6', 'name': '雷殺'},
    {'suit': 'club', 'point': '7', 'name': '雷殺'},
    {'suit': 'club', 'point': '8', 'name': '雷殺'},
    {'suit': 'club', 'point': '9', 'name': '酒'},
    {'suit': 'club', 'point': '10', 'name': '鐵索連環'},
    {'suit': 'club', 'point': 'J', 'name': '鐵索連環'},
    {'suit': 'club', 'point': 'Q', 'name': '鐵索連環'},
    {'suit': 'club', 'point': 'K', 'name': '鐵索連環'},

    # Diamond (♦)
    {'suit': 'diamond', 'point': 'A', 'name': '朱雀羽扇'},
    {'suit': 'diamond', 'point': '2', 'name': '火殺'},
    {'suit': 'diamond', 'point': '3', 'name': '桃'},
    {'suit': 'diamond', 'point': '4', 'name': '閃'},
    {'suit': 'diamond', 'point': '5', 'name': '閃'},
    {'suit': 'diamond', 'point': '6', 'name': '閃'},
    {'suit': 'diamond', 'point': '7', 'name': '閃'},
    {'suit': 'diamond', 'point': '8', 'name': '閃'},
    {'suit': 'diamond', 'point': '9', 'name': '桃'},
    {'suit': 'diamond', 'point': '10', 'name': '火殺'},
    {'suit': 'diamond', 'point': 'J', 'name': '無懈可擊'},
    {'suit': 'diamond', 'point': 'Q', 'name': '火攻'},
    {'suit': 'diamond', 'point': 'K', 'name': '酒'}
]

def extract_image_from_fandom(card_name):
    # Try simplified and traditional names on Fandom wiki
    urls_to_try = [
        f"https://sanguosha.fandom.com/zh/wiki/{urllib.parse.quote(card_name)}",
    ]
    
    # Also map some common names if traditional map is needed
    trad_name = card_name
    if card_name == '殺': trad_name = '杀'
    elif card_name == '閃': trad_name = '闪'
    elif card_name == '鐵索連環': trad_name = '铁索连环'
    elif card_name == '無懈可擊': trad_name = '无懈可击'
    elif card_name == '兵糧寸斷': trad_name = '兵粮寸断'
    elif card_name == '木牛流馬': trad_name = '木牛流马'
    elif card_name == '白銀獅子': trad_name = '白银狮子'
    elif card_name == '驊騮': trad_name = '骅骝'
    elif card_name == '桃園結義': trad_name = '桃园结义'
    elif card_name == '萬箭齊發': trad_name = '万箭齐发'
    elif card_name == '五穀豐登': trad_name = '五谷丰登'
    elif card_name == '借刀殺人': trad_name = '借刀杀人'
    elif card_name == '過河拆橋': trad_name = '过河拆桥'
    elif card_name == '順手牽羊': trad_name = '顺手牵羊'
    
    if trad_name != card_name:
        urls_to_try.append(f"https://sanguosha.fandom.com/zh/wiki/{urllib.parse.quote(trad_name)}")

    for url in urls_to_try:
        try:
            res = requests.get(url, headers=HEADERS, timeout=10, verify=False)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                
                # 1. Look for portable-infobox image (most reliable for card face)
                infobox = soup.find(class_='portable-infobox')
                if infobox:
                    img_tag = infobox.find('a', class_='image')
                    if img_tag and img_tag.get('href'):
                        return img_tag.get('href').split('/revision/')[0]
                
                # 2. Look for any links with File: and containing card name
                for a_tag in soup.find_all('a', class_='image'):
                    href = a_tag.get('href', '')
                    if any(ext in href.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']):
                        # Avoid character avatars if possible
                        if 'File:' in href and (card_name in urllib.parse.unquote(href) or trad_name in urllib.parse.unquote(href)):
                            return href.split('/revision/')[0]
                            
                # 3. Fallback to first image link
                for a_tag in soup.find_all('a', class_='image'):
                    href = a_tag.get('href', '')
                    if 'File:' in href or any(ext in href.lower() for ext in ['.png', '.jpg', '.jpeg']):
                        return href.split('/revision/')[0]
        except Exception as e:
            print(f"  [!] Fandom 爬蟲抓取 {url} 失敗: {e}")
            
    return None

def download_image_as_png(url, save_path):
    try:
        res = requests.get(url, headers=HEADERS, timeout=15, verify=False)
        if res.status_code == 200:
            # Load with PIL to verify and convert
            img_data = res.content
            img = Image.open(io.BytesIO(img_data))
            img.save(save_path, 'PNG')
            return True
        else:
            print(f"  [!] HTTP 狀態碼錯誤 {res.status_code} URL: {url}")
    except Exception as e:
        print(f"  [!] 圖片下載/轉換 PNG 失敗: {e}")
    return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cards_dir = os.path.join(script_dir, "assets", "SanGuoSha", "cards")
    os.makedirs(cards_dir, exist_ok=True)
    
    print("==================================================")
    # Highlight specific model name in a friendly manner as required
    print("三國殺 (SanGuoSha) 擴充卡牌高畫質下載工具 (由 Antigravity 驅動)")
    print("==================================================")
    print(f"下載目標資料夾: {cards_dir}\n")
    
    # 1. Ask user if they also want to restore standard card images to fix overwrites
    restore_ans = input("是否一併下載/修復標準版損毀的卡牌圖片 (例如: 殺、閃、桃、無懈可擊)？(y/n): ").strip().lower()
    restore_standard = restore_ans in ['y', 'yes', '']
    
    print("\n--- 步驟 1: 下載 52 張軍爭篇撲克花色卡牌 ---")
    downloaded_count = 0
    
    for i, card in enumerate(MILITARY_CARDS_LIST):
        suit = card['suit']
        point = card['point']
        name = card['name']
        eng_name = CARD_FILENAMES.get(name, 'card')
        
        filename = f"{suit}_{point}_{eng_name}.png"
        filepath = os.path.join(cards_dir, filename)
        
        # Skip if already exists
        if os.path.exists(filepath):
            print(f"[{i+1}/52] {suit}_{point}_{name} -> 已存在，跳過。")
            downloaded_count += 1
            continue
            
        print(f"[{i+1}/52] 正在下載: {suit}_{point}_{name}...")
        
        # Try Fandom Wiki first (to get the full card scan, which is what the user wants)
        print(f"  [-] 正在從 Fandom Wiki 搜尋並下載完整卡牌圖片...")
        fandom_img_url = extract_image_from_fandom(name)
        download_success = False
        if fandom_img_url:
            download_success = download_image_as_png(fandom_img_url, filepath)
            if download_success:
                print(f"  [✓] 成功從 Fandom Wiki 下載並轉為 PNG")
                
        # Only if Fandom fails, try Noname GitHub as fallback
        if not download_success:
            print(f"  [-] Fandom 獲取失敗，嘗試從 Noname GitHub 下載縮圖...")
            key = CARD_KEYS.get(name)
            if key:
                noname_url = f"https://raw.githubusercontent.com/libccy/noname/master/image/card/{key}.png"
                download_success = download_image_as_png(noname_url, filepath)
                if download_success:
                    print(f"  [✓] 成功從 Noname GitHub 下載並轉為 PNG")
            
        if download_success:
            downloaded_count += 1
            time.sleep(0.1) # Small delay to be polite to servers
        else:
            print(f"  [✗] 無法獲取 {name} 的圖片！")
            
    print(f"\n軍爭篇 52 張卡牌下載完成！成功: {downloaded_count}/52 張")
    
    # 2. Restore standard cards if requested
    if restore_standard:
        print("\n--- 步驟 2: 正在修復標準版與其它擴充版卡牌圖片 ---")
        standard_cards = [
            '殺', '閃', '桃', '酒', '過河拆橋', '順手牽羊', '無中生有', '決鬥', '借刀殺人', 
            '五穀豐登', '南蠻入侵', '萬箭齊發', '桃園結義', '無懈可擊', '鐵索連環', '火攻',
            '樂不思蜀', '兵糧寸斷', '閃電', '諸葛連弩', '雌雄雙股劍', '青釭劍', '青龍偃月刀',
            '丈八蛇矛', '貫石斧', '方天畫戟', '麒麟弓', '白銀獅子', '木牛流馬', '絕影',
            '的盧', '爪黃飛電', '赤兔', '大宛', '紫騂', '銀月槍', '水淹七軍', '兵臨城下',
            '遠交近攻', '知己知彼', '三尖兩刃刀', '驚帆', '玉龍'
        ]
        
        restored_count = 0
        for name in standard_cards:
            key = CARD_KEYS.get(name)
            if not key:
                continue
                
            # Overwrite both PNG and JPG to be safe and fix any previous wrong file formats
            png_path = os.path.join(cards_dir, f"{name}.png")
            jpg_path = os.path.join(cards_dir, f"{name}.jpg")
            
            print(f"正在修復/獲取: {name} ...")
            
            # Try Fandom Wiki first to get full card scan
            print(f"  [-] 正在從 Fandom Wiki 搜尋並下載完整卡牌圖片...")
            fandom_img_url = extract_image_from_fandom(name)
            success = False
            if fandom_img_url:
                success = download_image_as_png(fandom_img_url, png_path)
                if success:
                    # Save as JPG as well to fix overwrites
                    try:
                        img = Image.open(png_path)
                        img.convert('RGB').save(jpg_path, 'JPEG')
                    except Exception:
                        pass
                    print(f"  [✓] 成功自 Wiki 獲取並修復: {name}.png 與 {name}.jpg")
                    restored_count += 1
            
            # Fallback to Noname GitHub if Fandom fails
            if not success:
                print(f"  [-] Fandom 獲取失敗，嘗試從 Noname GitHub 下載縮圖...")
                noname_url = f"https://raw.githubusercontent.com/libccy/noname/master/image/card/{key}.png"
                success = download_image_as_png(noname_url, png_path)
                if success:
                    try:
                        img = Image.open(png_path)
                        img.convert('RGB').save(jpg_path, 'JPEG')
                    except Exception:
                        pass
                    print(f"  [✓] 成功自 Noname GitHub 下載並修復: {name}.png 與 {name}.jpg")
                    restored_count += 1
                else:
                    print(f"  [✗] 無法獲取 {name}")
            time.sleep(0.1)
            
        print(f"\n標準版與擴充版卡牌修復完成！成功修復: {restored_count} 張卡牌")
        
    print("\n[✔] 所有下載與修復任務執行完畢！")
    input("請按下 Enter 鍵離開...")

if __name__ == '__main__':
    main()
