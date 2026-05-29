import urllib.request
import urllib.parse
import json
import os
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

HERO_ID_MAP = {
    "曹操": "cao_cao", "司馬懿": "si_ma_yi", "夏侯惇": "xia_hou_dun", "張遼": "zhang_liao",
    "許褚": "xu_chu", "郭嘉": "guo_jia", "甄姬": "zhen_ji",
    "劉備": "liu_bei", "關羽": "guan_yu", "張飛": "zhang_fei", "諸葛亮": "zhu_ge_liang",
    "趙雲": "zhao_yun", "馬超": "ma_chao", "黃月英": "huang_yue_ying",
    "孫權": "sun_quan", "甘寧": "gan_ning", "呂蒙": "lu_meng", "黃蓋": "huang_gai",
    "周瑜": "zhou_yu", "大喬": "da_qiao", "陸遜": "lu_xun", "孫尚香": "sun_shang_xiang",
    "呂布": "lu_bu", "貂蟬": "diao_chan", "華佗": "hua_tuo", "袁紹": "yuan_shao", "華雄": "hua_xiong"
}

# 簡體對照 (MediaWiki API 需要簡體檔名)
SIMP_MAP = {
    "曹操": "曹操", "司馬懿": "司马懿", "夏侯惇": "夏侯惇", "張遼": "张辽",
    "許褚": "许褚", "郭嘉": "郭嘉", "甄姬": "甄姬",
    "劉備": "刘备", "關羽": "关羽", "張飛": "张飞", "諸葛亮": "诸葛亮",
    "趙雲": "赵云", "馬超": "马超", "黃月英": "黄月英",
    "孫權": "孙权", "甘寧": "甘宁", "呂蒙": "吕蒙", "黃蓋": "黄盖",
    "周瑜": "周瑜", "大喬": "大乔", "陸遜": "陆逊", "孫尚香": "孙尚香",
    "呂布": "吕布", "貂蟬": "貂蝉", "華佗": "华佗", "袁紹": "袁绍", "華雄": "华雄"
}

os.makedirs("assets/SanGuoSha/heroes", exist_ok=True)

for trad, simp in SIMP_MAP.items():
    filename = f"File:{simp}-经典形象.png"
    api_url = f"https://wiki.biligame.com/sgs/api.php?action=query&prop=imageinfo&iiprop=url&titles={urllib.parse.quote(filename)}&format=json"
    
    try:
        req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req).read().decode('utf-8')
        data = json.loads(res)
        
        pages = data.get("query", {}).get("pages", {})
        page = list(pages.values())[0]
        
        if "imageinfo" in page:
            img_url = page["imageinfo"][0]["url"]
            hero_id = HERO_ID_MAP[trad]
            img_path = f"assets/SanGuoSha/heroes/{hero_id}.png"
            
            print(f"Downloading {trad} ({simp}) -> {img_path}")
            urllib.request.urlretrieve(img_url, img_path)
        else:
            print(f"Error: Image not found for {trad} ({simp}) via API.")
            
    except Exception as e:
        print(f"Failed to process {trad}: {e}")
        
    time.sleep(0.5)

print("\n下載完成！請重新整理 SanGuoSha.html 查看結果。")
