import requests
from bs4 import BeautifulSoup
import urllib.parse
import ssl

# Disable SSL warnings
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
}

def check_url(url, label):
    print(f"\n--- Checking: {label} ({url}) ---")
    try:
        res = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            print(f"Title: {soup.title.text if soup.title else 'No title'}")
            # Find links or tables
            tables = soup.find_all('table')
            print(f"Found {len(tables)} tables")
            # Print a few links
            links = [a.get('href') for a in soup.find_all('a') if a.get('href')]
            print(f"Found {len(links)} links. First 10 links:")
            for l in links[:10]:
                print("  ", l)
    except Exception as e:
        print(f"Error checking {label}: {e}")

urls = {
    "Wiki Main": "https://sanguosha.fandom.com/zh/wiki/%E4%B8%89%E5%9B%BD%E6%9D%80_%E7%BB%B4%E5%9F%BA",
    "Shenhua Zailin": "https://sanguosha.fandom.com/zh/wiki/%E7%89%8C/%E7%A5%9E%E8%AF%9D%E5%86%8D%E4%B8%B5",
    "Jiexian Tupo": "https://sanguosha.fandom.com/zh/wiki/%E7%89%8C/%E7%95%8C%E9%99%90%E7%AA%81%E7%A0%B4",
    "SP": "https://sanguosha.fandom.com/zh/wiki/%E7%89%8C/SP"
}

for name, url in urls.items():
    check_url(url, name)
