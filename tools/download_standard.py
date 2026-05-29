import os
import time
import requests
import urllib3
urllib3.disable_warnings()

CARD_KEYS = {
    '殺': 'sha', '雷殺': 'sha_thunder', '火殺': 'sha_fire', '閃': 'shan', '桃': 'tao', '酒': 'jiu',
    '過河拆橋': 'guohe', '順手牽羊': 'shunshou', '無中生有': 'wuzhong', '決鬥': 'juedou', '借刀殺人': 'jiedao',
    '五穀豐登': 'wugu', '南蠻入侵': 'nanman', '萬箭齊發': 'wanjian', '桃園結義': 'taoyuan', '無懈可擊': 'wuxie',
    '鐵索連環': 'tiesuo', '火攻': 'huogong', '樂不思蜀': 'lebu', '兵糧寸斷': 'bingliang', '閃電': 'shandian',
    '諸葛連弩': 'zhuge', '雌雄雙股劍': 'shuanggu', '青釭劍': 'qinggang', '青龍偃月刀': 'qinglong',
    '丈八蛇矛': 'zhangba', '貫石斧': 'guanshi', '方天畫戟': 'fangtian', '麒麟弓': 'qilin',
    '古錠刀': 'guding', '朱雀羽扇': 'zhuque', '吳六劍': 'wuliu', '寒冰劍': 'hanbing',
    '八卦陣': 'bagua', '仁王盾': 'renwang', '藤甲': 'tengjia', '白銀獅子': 'baiyin', '木牛流馬': 'muniu',
    '絕影': 'jueying', '的盧': 'dilu', '爪黃飛電': 'zhuahuang', '驊騮': 'hualiu', '赤兔': 'chitu',
    '大宛': 'dawan', '紫騂': 'zixin', '銀月槍': 'yinyue', '水淹七軍': 'shuiyan', '兵臨城下': 'binglin',
    '遠交近攻': 'yuanjiao', '知己知彼': 'zhiji', '三尖兩刃刀': 'sanjian', '驚帆': 'jingfan', '玉龍': 'yulong'
}

# 繁簡對照 (下載的檔名將使用繁體，與原腳本保持一致)
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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cards_dir = os.path.join(os.path.dirname(script_dir), "assets", "SanGuoSha", "cards")
    os.makedirs(cards_dir, exist_ok=True)
    
    print(f"準備下載至: {cards_dir}")
    
    for name in CARDS:
        key = CARD_KEYS.get(name)
        if not key:
            continue
            
        final_path = os.path.join(cards_dir, f"{name}.png")
        if os.path.exists(final_path):
            print(f"[{name}] 檔案已存在，跳過。")
            continue
            
        url = f"https://raw.githubusercontent.com/libccy/noname/master/image/card/{key}.png"
        
        try:
            res = requests.get(url, headers=HEADERS, timeout=10, verify=False)
            if res.status_code == 200:
                with open(final_path, 'wb') as f:
                    f.write(res.content)
                print(f"[+] 成功下載: {name}.png")
            else:
                print(f"[!] 找不到圖片: {name} (HTTP {res.status_code})")
        except Exception as e:
            print(f"[!] 下載 {name} 發生錯誤: {e}")
            
        time.sleep(0.1)
        
    print("\n[✔] 所有標準版卡牌下載完成！")

if __name__ == '__main__':
    main()
