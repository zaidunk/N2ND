import os
import sys
import json

API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
ACCOUNT_ID = os.environ.get('CF_ACCOUNT_ID') or os.environ.get('CF_ACCOUNT') or '1bf621dc7f7708c47ea82cb36d6bb8f6'
SCRIPT_NAME = 'n2nd-worker'

if not API_TOKEN:
    print('Missing CLOUDFLARE_API_TOKEN')
    sys.exit(2)

token_value = os.environ.get('HF_TO_SET') or os.environ.get('HUGGINGFACE_API_TOKEN')
if not token_value:
    print('Provide HF token via env var HF_TO_SET or HUGGINGFACE_API_TOKEN')
    sys.exit(2)

url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}/secrets'
payload = {'name': 'HUGGINGFACE_API_TOKEN', 'text': token_value, 'type': 'secret_text'}
headers = {'Authorization': f'Bearer {API_TOKEN}', 'Content-Type': 'application/json'}

import httpx
resp = httpx.put(url, headers=headers, json=payload, timeout=30.0)
print('status', resp.status_code)
print(resp.text)
resp.raise_for_status()
print('Secret set successfully')
