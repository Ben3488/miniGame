import re
with open(r'C:\Users\Poting\.gemini\antigravity-ide\brain\5a891ac3-468a-4561-b54f-4fdd9efbd194\.system_generated\steps\165\content.md', encoding='utf-8') as f:
    html = f.read()
urls = re.findall(r'https://static\.wikia\.nocookie\.net[^\s\"\'\>]+', html)
for u in set(urls):
    print(u)
