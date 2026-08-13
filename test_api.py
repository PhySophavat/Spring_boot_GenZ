import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8081"

def make_request(method, path, body=None, token=None):
    url = BASE_URL + path
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if body:
        data = json.dumps(body).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.getcode()
            content = resp.read().decode("utf-8")
            print(f"[{method}] {path} -> Status: {status}")
            if content:
                print(f"  Response: {content[:500]}")
            return status, content
    except urllib.error.HTTPError as e:
        status = e.code
        content = e.read().decode("utf-8")
        print(f"[{method}] {path} -> Status: {status}")
        print(f"  Error Response: {content[:500]}")
        return status, content
    except Exception as e:
        print(f"[{method}] {path} -> Connection Error: {e}")
        return None, str(e)

print("=" * 60)
print("TEST 1: Check server is running - GET /api/users")
print("=" * 60)
status, _ = make_request("GET", "/api/users")
if status is None:
    print("\n*** BACKEND SERVER IS NOT RUNNING ON PORT 8081 ***")
    print("Please start the backend server first.")
else:
    print("\n" + "=" * 60)
    print("TEST 2: Register a new user")
    print("=" * 60)
    import time
    unique_suffix = str(int(time.time()))[-6:]
    phone = f"09{unique_suffix}"
    register_body = {
        "fullName": "Security Test User",
        "phoneNumber": phone,
        "email": f"test_{unique_suffix}@example.com",
        "password": "SecurePass123!",
        "confirmPassword": "SecurePass123!"
    }
    status, content = make_request("POST", "/api/auth/register", register_body)
    
    token = None
    if status == 201:
        try:
            token = json.loads(content)["accessToken"]
            print(f"  ✅ Registration successful! Got token: {token[:30]}...")
        except Exception:
            print("  ⚠️  Could not extract token from registration response")
    
    print("\n" + "=" * 60)
    print("TEST 3: Login with the registered user")
    print("=" * 60)
    login_body = {
        "phoneNumber": phone,
        "password": "SecurePass123!"
    }
    status, content = make_request("POST", "/api/auth/login", login_body)
    if status == 200:
        try:
            token = json.loads(content)["accessToken"]
            print(f"  ✅ Login successful! Got token: {token[:30]}...")
        except Exception:
            print("  ⚠️  Could not extract token from login response")
    
    if token:
        print("\n" + "=" * 60)
        print("TEST 4: Get authenticated user's wallet")
        print("=" * 60)
        status, content = make_request("GET", "/api/wallets/me", token=token)
        
        print("\n" + "=" * 60)
        print("TEST 5: Deposit into wallet")
        print("=" * 60)
        deposit_body = {
            "amount": 100.00,
            "currency": "USD"
        }
        status, content = make_request("POST", "/api/wallets/me/deposit", deposit_body, token)
        
        print("\n" + "=" * 60)
        print("TEST 6: Get all users (dashboard data)")
        print("=" * 60)
        status, content = make_request("GET", "/api/users")
        
        print("\n" + "=" * 60)
        print("TEST 7: Get all wallets (dashboard data)")
        print("=" * 60)
        status, content = make_request("GET", "/api/wallets")
        
        print("\n" + "=" * 60)
        print("TEST 8: Get admin dashboard summary")
        print("=" * 60)
        status, content = make_request("GET", "/api/admin/dashboard/summary")
        
        print("\n" + "=" * 60)
        print("TEST 9: Get admin dashboard transactions")
        print("=" * 60)
        status, content = make_request("GET", "/api/admin/dashboard/transactions")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)