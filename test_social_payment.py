import urllib.request
import urllib.error
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8082"

def req(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else (b"" if method in ["POST", "PUT"] else None)
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def login(phone, password="password123"):
    status, data = req(f"{BASE_URL}/api/auth/login", method="POST", data={
        "phoneNumber": phone,
        "password": password
    })
    if status == 200:
        return data["accessToken"], data["user"]
    # Try alternative password
    status, data = req(f"{BASE_URL}/api/auth/login", method="POST", data={
        "phoneNumber": phone,
        "password": "Password123!"
    })
    if status == 200:
        return data["accessToken"], data["user"]
    raise Exception(f"Failed to login with phone {phone}: {data}")

def get_wallet(user_id):
    status, wallet = req(f"{BASE_URL}/api/wallets/{user_id}")
    return float(wallet.get("usdBalance", 0.0))

print("==================================================")
print("TESTING INSTANT SOCIAL PAYMENT IN CHAT")
print("==================================================")

# 1. Login as User 1 (Sophavat) and User 4 (Dara)
print("\n--- 1. Logging in Users ---")
token_sophavat, user_sophavat = login("012345678", "password123")
token_dara, user_dara = login("012888001", "password123")
print(f"Logged in Sender: {user_sophavat['fullName']} (ID: {user_sophavat['id']})")
print(f"Logged in Receiver: {user_dara['fullName']} (ID: {user_dara['id']})")

# 2. Check initial balances
sender_initial_bal = get_wallet(user_sophavat["id"])
receiver_initial_bal = get_wallet(user_dara["id"])
print(f"Initial Balances: Sender=${sender_initial_bal:.2f}, Receiver=${receiver_initial_bal:.2f}")

# 3. Create or get conversation between them
status, conv_res = req(f"{BASE_URL}/api/admin/chat/conversations", method="POST", data={"targetUserId": user_dara["id"]}, token=token_sophavat)
conv_id = conv_res["data"]["id"]
print(f"Conversation ID: {conv_id}")

# 4. Execute Instant Payment: $25.00 for "Lunch today 🍜"
print("\n--- 2. Executing Instant Payment: $25.00 ---")
payment_req = {
    "conversationId": conv_id,
    "receiverId": user_dara["id"],
    "amount": 25.00,
    "message": "Lunch today 🍜"
}

status, payment_res = req(f"{BASE_URL}/api/chat/payments", method="POST", data=payment_req, token=token_sophavat)
print(f"Payment HTTP Status: {status}")
print(f"Payment Response: {json.dumps(payment_res, indent=2)}")

assert status == 201, f"Expected 201 Created, got {status}"
assert payment_res["success"] is True, "Expected success: true"
payment_data = payment_res["data"]
assert payment_data["status"] == "COMPLETED", f"Expected COMPLETED, got {payment_data['status']}"
assert float(payment_data["amount"]) == 25.00, f"Expected 25.00, got {payment_data['amount']}"
assert payment_data["senderId"] == user_sophavat["id"], "Sender ID mismatch"
assert payment_data["receiverId"] == user_dara["id"], "Receiver ID mismatch"

# 5. Verify balances updated immediately in DB
sender_after_bal = get_wallet(user_sophavat["id"])
receiver_after_bal = get_wallet(user_dara["id"])
print(f"\nUpdated Balances: Sender=${sender_after_bal:.2f}, Receiver=${receiver_after_bal:.2f}")

expected_sender_bal = sender_initial_bal - 25.00
expected_receiver_bal = receiver_initial_bal + 25.00
assert abs(sender_after_bal - expected_sender_bal) < 0.01, f"Sender balance error: expected {expected_sender_bal}, got {sender_after_bal}"
assert abs(receiver_after_bal - expected_receiver_bal) < 0.01, f"Receiver balance error: expected {expected_receiver_bal}, got {receiver_after_bal}"
print("[PASS] Main Wallet Balances correctly updated (Single atomic transaction)!")

# 6. Verify Chat Payment Message in Conversation
print("\n--- 3. Verifying Chat Payment Message ---")
status, messages_res = req(f"{BASE_URL}/api/admin/chat/conversations/{conv_id}/messages?page=0&size=10", token=token_sophavat)
messages = messages_res["data"]["content"]
payment_msg = next((m for m in messages if m["messageType"] == "PAYMENT"), None)
assert payment_msg is not None, "PAYMENT message not found in conversation!"
print(f"[PASS] Found PAYMENT message (ID: {payment_msg['id']}):")
print(f"  messageType: {payment_msg['messageType']}")
print(f"  paymentInfo: {payment_msg.get('paymentInfo')}")
print(f"  content: {payment_msg.get('content')}")

# 7. Test Insufficient Balance Failure
print("\n--- 4. Testing Insufficient Balance ---")
excessive_req = {
    "conversationId": conv_id,
    "receiverId": user_dara["id"],
    "amount": 999999.00,
    "message": "Too much money"
}
status, err_res = req(f"{BASE_URL}/api/chat/payments", method="POST", data=excessive_req, token=token_sophavat)
print(f"Excessive payment HTTP status: {status}")
assert status == 400, f"Expected HTTP 400 for insufficient balance, got {status}"
print(f"Error response: {err_res}")
# Verify balances did not change
assert get_wallet(user_sophavat["id"]) == sender_after_bal, "Sender balance changed on failed tx!"
assert get_wallet(user_dara["id"]) == receiver_after_bal, "Receiver balance changed on failed tx!"
print("[PASS] Insufficient balance rejected and rolled back properly!")

# 8. Test Self Payment Failure
print("\n--- 5. Testing Self-Payment Prevention ---")
self_req = {
    "conversationId": conv_id,
    "receiverId": user_sophavat["id"],
    "amount": 10.00,
    "message": "Pay myself"
}
status, self_err = req(f"{BASE_URL}/api/chat/payments", method="POST", data=self_req, token=token_sophavat)
print(f"Self payment HTTP status: {status}")
assert status == 400, f"Expected HTTP 400 for self payment, got {status}"
print("[PASS] Self-payment prevented!")

print("\n==================================================")
print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
print("==================================================")
