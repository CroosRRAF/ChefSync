import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:8000/api/orders/addresses/'
# sample payload similar to the frontend newAddress
payload = {
    'label': 'Home',
    'address_line1': '100 Test Street',
    'address_line2': 'Apt 1',
    'city': 'Colombo',
    'pincode': '00000',
    'latitude': 6.9271,
    'longitude': 79.8612,
    'is_default': False
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8')
        print('STATUS:', resp.status)
        print('BODY:', body)
except urllib.error.HTTPError as e:
    try:
        body = e.read().decode('utf-8')
    except Exception:
        body = '<no body>'
    print('HTTP ERROR', e.code)
    print('RESPONSE:', body)
except Exception as ex:
    print('ERROR:', ex)
