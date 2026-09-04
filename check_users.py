import urllib.request
import json

req = urllib.request.Request('http://localhost:8082/api/users')
resp = urllib.request.urlopen(req)
users = json.loads(resp.read().decode('utf-8'))
print('USERS IN DB:')
for u in users:
    print(f"ID: {u.get('id')}, Name: {u.get('fullName')}, Phone: {u.get('phoneNumber')}, Email: {u.get('email')}")

print("\nNOTIFICATIONS FOR ALL USERS:")
for u in users:
    uid = u.get('id')
    try:
        n_req = urllib.request.Request(f'http://localhost:8082/api/mobile/notifications/all?userId={uid}')
        n_resp = urllib.request.urlopen(n_req)
        notifs = json.loads(n_resp.read().decode('utf-8'))
        print(f"\nUser {uid} ({u.get('fullName')}) has {len(notifs)} notifications:")
        for n in notifs:
            print(f"  - [{n.get('type')}] Title: {n.get('title')}, Msg: {n.get('message')}, Ref: {n.get('referenceId')}, Time: {n.get('createdAt')}")
    except Exception as e:
        print(f"User {uid} error: {e}")
