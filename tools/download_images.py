import os
import urllib.request
import json
import time

heroes = [
    "cao_cao", "da_qiao", "diao_chan", "gan_ning", "guan_yu", "guo_jia",
    "hua_tuo", "hua_xiong", "huang_gai", "huang_yue_ying", "liu_bei", "lu_bu",
    "lu_meng", "lu_xun", "ma_chao", "si_ma_yi", "sun_quan", "sun_shang_xiang",
    "xia_hou_dun", "xu_chu", "yuan_shao", "zhang_fei", "zhang_liao", "zhao_yun",
    "zhen_ji", "zhou_yu", "zhu_ge_liang"
]

base_url = "https://raw.githubusercontent.com/Mogara/QSanguosha-v2/master/image/generals/card/"
# Note: QSanguosha avatar names often don't have underscores. e.g., caocao.png
# Let's map them by removing underscores.
# Some might have specific names, we'll try removing underscores first.

output_dir = os.path.join(os.path.dirname(__file__), "assets", "SanGuoSha", "heroes")
os.makedirs(output_dir, exist_ok=True)

print(f"Downloading to {output_dir}")

for hero in heroes:
    # Handle pinyin "ü" -> "v" for Lü Bu and Lü Meng
    hero_name = hero.replace("_", "")
    if hero_name == "lubu":
        hero_name = "lvbu"
    elif hero_name == "lumeng":
        hero_name = "lvmeng"
        
    url = f"{base_url}{hero_name}.jpg"
    out_path = os.path.join(output_dir, f"{hero}.png")
    
    try:
        print(f"Fetching {url} ...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(out_path, 'wb') as f:
                f.write(response.read())
        print(f"Saved {out_path}")
    except Exception as e:
        print(f"Failed to download {hero} from {url}: {e}")
        # Try alternate extension or name if needed? 
        # In QSanguosha-v2, avatars are .png
        pass
    time.sleep(0.5)

print("Done.")
