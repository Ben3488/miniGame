import urllib.request
import re
import os
import ssl
import json
import time

ssl._create_default_https_context = ssl._create_unverified_context

HEROES = [
    "曹操", "司馬懿", "夏侯惇", "張遼", "許褚", "郭嘉", "甄姬",
    "劉備", "關羽", "張飛", "諸葛亮", "趙雲", "馬超", "黃月英",
    "孫權", "甘寧", "呂蒙", "黃蓋", "周瑜", "大喬", "陸遜", "孫尚香",
    "呂布", "貂蟬", "華佗", "袁紹", "華雄"
]

# Mapping traditional to simplified for biligame search if needed
SIMPLIFIED_MAP = {
    "曹操": "曹操", "司馬懿": "司马懿", "夏侯惇": "夏侯惇", "張遼": "张辽", 
    "許褚": "许褚", "郭嘉": "郭嘉", "甄姬": "甄姬",
    "劉備": "刘备", "關羽": "关羽", "張飛": "张飞", "諸葛亮": "诸葛亮", 
    "趙雲": "赵云", "馬超": "马超", "黃月英": "黄月英",
    "孫權": "孙权", "甘寧": "甘宁", "呂蒙": "吕蒙", "黃蓋": "黄盖", 
    "周瑜": "周瑜", "大喬": "大乔", "陸遜": "陆逊", "孫尚香": "孙尚香",
    "呂布": "吕布", "貂蟬": "貂蝉", "華佗": "华佗", "袁紹": "袁绍", "華雄": "华雄"
}

HERO_ID_MAP = {
    "曹操": "cao_cao", "司馬懿": "si_ma_yi", "夏侯惇": "xia_hou_dun", "張遼": "zhang_liao",
    "許褚": "xu_chu", "郭嘉": "guo_jia", "甄姬": "zhen_ji",
    "劉備": "liu_bei", "關羽": "guan_yu", "張飛": "zhang_fei", "諸葛亮": "zhu_ge_liang",
    "趙雲": "zhao_yun", "馬超": "ma_chao", "黃月英": "huang_yue_ying",
    "孫權": "sun_quan", "甘寧": "gan_ning", "呂蒙": "lu_meng", "黃蓋": "huang_gai",
    "周瑜": "zhou_yu", "大喬": "da_qiao", "陸遜": "lu_xun", "孫尚香": "sun_shang_xiang",
    "呂布": "lu_bu", "貂蟬": "diao_chan", "華佗": "hua_tuo", "袁紹": "yuan_shao", "華雄": "hua_xiong"
}

os.makedirs("assets/SanGuoSha/heroes", exist_ok=True)

for trad, simp in SIMPLIFIED_MAP.items():
    try:
        url = f"https://wiki.biligame.com/sgs/{urllib.parse.quote(simp)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # match img src for classic image
        match = re.search(r'src="([^"]+?201px-' + simp + r'-经典形象\.png)"', html)
        if not match:
             match = re.search(r'src="([^"]+?-' + simp + r'-经典形象\.png)"', html)
        if not match:
             match = re.search(r'src="([^"]+?' + simp + r'.*?\.png)"', html)
             
        if match:
            img_url = match.group(1)
            # handle relative url
            if img_url.startswith('/'):
                img_url = "https:" + img_url
            elif not img_url.startswith('http'):
                img_url = "https://patchwiki.biligame.com" + img_url
            
            hero_id = HERO_ID_MAP[trad]
            img_path = f"assets/SanGuoSha/heroes/{hero_id}.png"
            
            print(f"Downloading {trad} from {img_url}")
            urllib.request.urlretrieve(img_url, img_path)
        else:
            print(f"Could not find image for {trad}")
    except Exception as e:
        print(f"Failed to process {trad}: {e}")
    time.sleep(1)

print("Download complete.")
