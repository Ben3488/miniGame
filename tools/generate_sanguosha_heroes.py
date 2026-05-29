from pathlib import Path
from xml.sax.saxutils import escape

heroes = [
    ("cao_cao", "曹操", "wei", "奸雄 / 護駕"),
    ("si_ma_yi", "司馬懿", "wei", "反饋 / 鬼才"),
    ("xia_hou_dun", "夏侯惇", "wei", "剛烈"),
    ("zhang_liao", "張遼", "wei", "突襲"),
    ("xu_chu", "許褚", "wei", "裸衣"),
    ("guo_jia", "郭嘉", "wei", "天妒 / 遺計"),
    ("zhen_ji", "甄姬", "wei", "傾國 / 洛神"),
    ("liu_bei", "劉備", "shu", "仁德 / 激將"),
    ("guan_yu", "關羽", "shu", "武聖"),
    ("zhang_fei", "張飛", "shu", "咆哮"),
    ("zhu_ge_liang", "諸葛亮", "shu", "觀星 / 空城"),
    ("zhao_yun", "趙雲", "shu", "龍膽"),
    ("ma_chao", "馬超", "shu", "馬術 / 鐵騎"),
    ("huang_yue_ying", "黃月英", "shu", "集智 / 奇才"),
    ("sun_quan", "孫權", "wu", "制衡 / 救援"),
    ("gan_ning", "甘寧", "wu", "奇襲"),
    ("lu_meng", "呂蒙", "wu", "克己"),
    ("huang_gai", "黃蓋", "wu", "苦肉"),
    ("zhou_yu", "周瑜", "wu", "英姿 / 反間"),
    ("da_qiao", "大喬", "wu", "國色 / 流離"),
    ("lu_xun", "陸遜", "wu", "謙遜 / 連營"),
    ("sun_shang_xiang", "孫尚香", "wu", "結姻 / 梟姬"),
    ("lu_bu", "呂布", "qun", "無雙"),
    ("diao_chan", "貂蟬", "qun", "離間 / 閉月"),
    ("hua_tuo", "華佗", "qun", "急救 / 青囊"),
    ("yuan_shao", "袁紹", "qun", "亂擊 / 血裔"),
    ("hua_xiong", "華雄", "qun", "耀武"),
]

factions = {
    "wei": ("魏", "#0f2f6f", "#69a7ff", "#dbeafe"),
    "shu": ("蜀", "#14532d", "#f2c94c", "#ecfccb"),
    "wu": ("吳", "#7f1d1d", "#f97316", "#fee2e2"),
    "qun": ("群", "#3b0764", "#d946ef", "#f5d0fe"),
}

out_dir = Path("assets/SanGuoSha/heroes")
out_dir.mkdir(parents=True, exist_ok=True)

for idx, (hero_id, name, faction, skills) in enumerate(heroes):
    mark, dark, accent, text = factions[faction]
    motif = ["M82 226c10-44 66-62 92 0v50H82z", "M72 232c24-54 78-54 102 0v42H72z"][idx % 2]
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{dark}"/>
      <stop offset=".52" stop-color="#17120f"/>
      <stop offset="1" stop-color="{accent}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="34%" r="58%">
      <stop offset="0" stop-color="{accent}" stop-opacity=".78"/>
      <stop offset="1" stop-color="{accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="240" height="336" rx="18" fill="url(#bg)"/>
  <rect x="10" y="10" width="220" height="316" rx="15" fill="none" stroke="#f8dc8a" stroke-width="4"/>
  <circle cx="120" cy="112" r="94" fill="url(#halo)"/>
  <text x="120" y="62" text-anchor="middle" font-size="42" font-family="serif" font-weight="700" fill="#fde68a">{escape(mark)}</text>
  <path d="{motif}" fill="#201a17" stroke="#f8dc8a" stroke-width="3"/>
  <circle cx="120" cy="132" r="54" fill="#d8a15d" stroke="#3f2615" stroke-width="4"/>
  <path d="M70 118c18-48 80-64 112-18-24-3-39 7-62 3-23-4-35 0-50 15z" fill="#151515"/>
  <path d="M86 166c20 20 48 20 68 0" fill="none" stroke="#5c371f" stroke-width="5" stroke-linecap="round"/>
  <rect x="26" y="252" width="188" height="58" rx="8" fill="rgba(0,0,0,.58)" stroke="#f8dc8a" stroke-width="1.5"/>
  <text x="120" y="285" text-anchor="middle" font-size="34" font-family="serif" font-weight="800" fill="{text}">{escape(name)}</text>
  <text x="120" y="306" text-anchor="middle" font-size="15" font-family="sans-serif" font-weight="700" fill="#fde68a">{escape(skills)}</text>
</svg>
"""
    (out_dir / f"{hero_id}.svg").write_text(svg, encoding="utf-8")

print(f"generated {len(heroes)} hero portraits")
