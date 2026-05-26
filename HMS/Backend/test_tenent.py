import requests
r = requests.post('http://127.0.0.1:8000/api/tenent/', data={'name': 'Test', 'phone': '9999999999'})
print(r.status_code)
print(r.text)
