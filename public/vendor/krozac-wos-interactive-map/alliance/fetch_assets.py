import urllib.request
import re
import os

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://wostools.net/territory-planner'
req = urllib.request.Request(url, headers=headers)
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
except Exception as e:
    print('Failed to load html:', e)
    exit(1)

scripts = re.findall(r'src="([^"]+\.js[^"]*)"', html)
print('Found scripts:', scripts)

png_urls = set()
for script in scripts:
    if script.startswith('/'):
        script_url = 'https://wostools.net' + script
    else:
        script_url = script
    try:
        req = urllib.request.Request(script_url, headers=headers)
        js = urllib.request.urlopen(req).read().decode('utf-8')
        pngs = re.findall(r'([a-zA-Z0-9_\-\/\.]+\.(?:png|webp|svg))', js)
        for p in pngs:
            png_urls.add(p)
    except Exception as e:
        print('Failed to load script', script_url, e)

for p in sorted(png_urls):
    if 'sunfire' in p.lower() or 'turret' in p.lower() or 'castle' in p.lower():
        print('POSSIBLE ASSET:', p)
