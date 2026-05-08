import os
import sys
import json

try:
    import httpx
except Exception:
    httpx = None

ACCOUNT_ID = os.environ.get('CF_ACCOUNT_ID') or os.environ.get('CF_ACCOUNT') or '1bf621dc7f7708c47ea82cb36d6bb8f6'
API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN') or os.environ.get('CF_API_TOKEN')
SCRIPT_NAME = 'n2nd-worker'

if not API_TOKEN:
    print('Missing CLOUDFLARE_API_TOKEN in environment')
    sys.exit(2)

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'worker.js')
with open(SCRIPT_PATH, 'r', encoding='utf-8') as f:
    code = f.read()

url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}'
headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/javascript'
}

print('Uploading worker to', url)
if httpx:
    r = httpx.put(url, content=code.encode('utf-8'), headers=headers, timeout=60.0)
    try:
        print('status:', r.status_code)
        print(r.text)
    except Exception:
        print('Uploaded, but failed to print response')
    r.raise_for_status()
else:
    import urllib.request
    req = urllib.request.Request(url, data=code.encode('utf-8'), headers=headers, method='PUT')
    with urllib.request.urlopen(req, timeout=60) as resp:
        print('status:', resp.status)
        print(resp.read().decode())

print('Worker uploaded. It should be available under workers.dev if your account has workers.dev enabled.')
