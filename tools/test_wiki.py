import requests
from bs4 import BeautifulSoup
import urllib3
import urllib.parse

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
}

url = "https://sanguosha.fandom.com/zh/wiki/" + urllib.parse.quote("殺")

res = requests.get(url, headers=HEADERS, verify=False)
soup = BeautifulSoup(res.text, 'html.parser')

print("Status Code:", res.status_code)
print("URL fetched:", res.url)

# Print out a few image tags to see their classes
imgs = soup.find_all('img')
print(f"Found {len(imgs)} img tags. Printing first 10:")
for img in imgs[:10]:
    print("IMG:", img.get('class'), img.get('src'))
    
# Check what 'a' tags look like for images
a_tags = soup.find_all('a', class_=lambda c: c and 'image' in c)
print(f"Found {len(a_tags)} a tags with 'image' in class:")
for a in a_tags[:5]:
    print("A TAG:", a.get('class'), a.get('href'))

# Let's also check for pi-image (Portable Infobox image)
pi_images = soup.find_all(class_="pi-image")
print(f"Found {len(pi_images)} pi-images:")
for pi in pi_images:
    a = pi.find('a')
    if a:
        print("PI-IMAGE A HREF:", a.get('href'))
