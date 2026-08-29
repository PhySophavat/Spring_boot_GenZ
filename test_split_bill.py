import urllib.request
import urllib.error
import json
import sys

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

def register_user(fullName, phone, email, password="Password123!"):
    status, data = req(f"{BASE_URL}/api/auth/register", method="POST", data={
        "fullName": fullName,
        "phoneNumber": phone,
        "email": email,
        "password": password,
        "confirmPassword": password
    })
    if status in [200, 201]:
        return data["user"]["id"]
    # If already exists, find user id from /api/users
    status, users = req(f"{BASE_URL}/api/users")
    for u in users:
        if u["phoneNumber"] == phone:
            return u["id"]
    raise Exception(f"Failed to register/find {fullName}")

def get_wallet(user_id):
    status, wallet = req(f"{BASE_URL}/api/wallets/{user_id}")
    return wallet

def get_wallet_balance(user_id):
    wallet = get_wallet(user_id)
    return float(wallet.get("usdBalance", 0.0))

def set_wallet_balance(user_id, target_amount):
    current = get_wallet_balance(user_id)
    diff = round(target_amount - current, 2)
    if diff > 0:
        req(f"{BASE_URL}/api/wallets/me/deposit?userId={user_id}", method="POST", data={
            "amount": diff,
            "currency": "USD"
        })

def run_acceptance_test():
    print("==================================================")
    print("RUNNING SPLIT BILL ACCEPTANCE TEST")
    print("==================================================")

    # 1. Setup Users
    print("\n--- 1. Setting up Users A, B, C, D, E ---")
    user_a = register_user("Sophavat", "012345678", "sophavat@flexpay.com")
    user_b = register_user("Dara", "012888001", "dara@flexpay.com")
    user_c = register_user("Sopheak", "012888002", "sopheak@flexpay.com")
    user_d = register_user("Lina", "012888003", "lina@flexpay.com")
    user_e = register_user("Vannak", "012888004", "vannak@flexpay.com")
    print(f"Users setup: A={user_a}, B={user_b}, C={user_c}, D={user_d}, E={user_e}")

    # Set balances: A has $100, B, C, D, E have $20 each
    set_wallet_balance(user_a, 100.00)
    for u in [user_b, user_c, user_d, user_e]:
        set_wallet_balance(u, 20.00)

    print(f"Initial Balances: A=${get_wallet_balance(user_a):.2f}, B=${get_wallet_balance(user_b):.2f}")

    # 2. User A simulates paying restaurant bill -$20
    print("\n--- 2. User A pays $20 restaurant bill up front ---")
    # For simulation, we adjust A's balance to $80 ($100 - $20 paid)
    # So after collecting $16, A will end at $96
    current_a = get_wallet_balance(user_a)

    initial_a = get_wallet_balance(user_a)
    print(f"User A balance before split collection: ${initial_a:.2f}")

    # 3. User A creates Split Bill
    print("\n--- 3. User A creates Split Bill ($20 with 4 friends) ---")
    create_payload = {
        "totalAmount": 20.00,
        "note": "Dinner with Friends",
        "splitType": "EQUAL",
        "friendIds": [user_b, user_c, user_d, user_e]
    }
    status, split_bill = req(f"{BASE_URL}/api/split-bills?userId={user_a}", method="POST", data=create_payload)
    assert status == 201, f"Failed to create split bill: {status}, {split_bill}"
    split_id = split_bill["id"]
    print(f"Split Bill created successfully! ID: {split_id}")
    print(f"Total Amount: ${split_bill['totalAmount']:.2f}")
    print(f"Status: {split_bill['status']}")
    print(f"Total to collect: ${split_bill['totalToCollect']:.2f}")
    print(f"Members count: {len(split_bill['members'])}")

    # Verify members
    members = split_bill["members"]
    assert len(members) == 5, f"Expected 5 participants, got {len(members)}"
    creator_member = next(m for m in members if m["isCreator"])
    assert creator_member["status"] == "PAID", "Creator must be marked PAID"
    assert creator_member["amount"] == 4.00, f"Creator share should be 4.00, got {creator_member['amount']}"

    for friend_id in [user_b, user_c, user_d, user_e]:
        fm = next(m for m in members if m["userId"] == friend_id)
        assert fm["status"] == "PENDING", f"Friend {friend_id} must be PENDING"
        assert fm["amount"] == 4.00, f"Friend {friend_id} share should be 4.00, got {fm['amount']}"

    print("All member allocations validated: $4.00 per person!")

    # Verify notifications were created for friends
    status, notifs_b = req(f"{BASE_URL}/api/mobile/notifications/all?userId={user_b}")
    b_has_req = any(n["type"] == "SPLIT_BILL_REQUEST" and n["referenceId"] == split_id for n in notifs_b)
    assert b_has_req, "Friend B should receive SPLIT_BILL_REQUEST notification"
    print("Friend notifications verified: received SPLIT_BILL_REQUEST")

    # 4. Each friend pays their $4 share
    print("\n--- 4. Friends pay their $4 share ---")
    b_bal_before = get_wallet_balance(user_b)
    a_bal_before = get_wallet_balance(user_a)

    # Friend B pays
    status, res_b = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_b}", method="POST")
    assert status == 200, f"B payment failed: {status}, {res_b}"
    b_bal_after = get_wallet_balance(user_b)
    a_bal_after_b = get_wallet_balance(user_a)
    assert round(b_bal_before - b_bal_after, 2) == 4.00, "B should be debited $4.00"
    assert round(a_bal_after_b - a_bal_before, 2) == 4.00, "A should be credited $4.00"
    print(f"Friend B paid $4.00 -> B balance: ${b_bal_after:.2f}, A balance: ${a_bal_after_b:.2f}")
    assert res_b["status"] == "PARTIALLY_PAID", "Split bill should be PARTIALLY_PAID"

    # Friend C pays
    status, res_c = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_c}", method="POST")
    assert status == 200, f"C payment failed: {status}, {res_c}"
    print(f"Friend C paid $4.00 -> Progress: {res_c['collectedAmount']}/{res_c['totalToCollect']} ({res_c['progressPercentage']}%)")

    # Friend D pays
    status, res_d = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_d}", method="POST")
    assert status == 200, f"D payment failed: {status}, {res_d}"
    print(f"Friend D paid $4.00 -> Progress: {res_d['collectedAmount']}/{res_d['totalToCollect']} ({res_d['progressPercentage']}%)")

    # Friend E pays
    status, res_e = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_e}", method="POST")
    assert status == 200, f"E payment failed: {status}, {res_e}"
    print(f"Friend E paid $4.00 -> Progress: {res_e['collectedAmount']}/{res_e['totalToCollect']} ({res_e['progressPercentage']}%)")

    # 5. Verify Split Completion
    print("\n--- 5. Verify Split Completion State ---")
    assert res_e["status"] == "COMPLETED", f"Split Bill status should be COMPLETED, got {res_e['status']}"
    assert res_e["collectedAmount"] == 16.00, f"Collected should be 16.00, got {res_e['collectedAmount']}"
    assert res_e["totalToCollect"] == 16.00, f"TotalToCollect should be 16.00, got {res_e['totalToCollect']}"
    assert res_e["progressPercentage"] == 100.0, f"Progress should be 100%, got {res_e['progressPercentage']}"

    # Verify A received total of $16
    final_a = get_wallet_balance(user_a)
    print(f"Creator final balance: ${final_a:.2f} (Total collected: +${final_a - initial_a:.2f})")
    assert round(final_a - initial_a, 2) == 16.00, "Creator should have collected exactly $16.00"

    # Verify Creator received SPLIT_BILL_COMPLETED notification
    status, notifs_a = req(f"{BASE_URL}/api/mobile/notifications/all?userId={user_a}")
    a_has_completed = any(n["type"] == "SPLIT_BILL_COMPLETED" and n["referenceId"] == split_id for n in notifs_a)
    assert a_has_completed, "Creator A should receive SPLIT_BILL_COMPLETED notification"
    print("Creator notification verified: received SPLIT_BILL_COMPLETED!")

    # 6. Verify Security & Negative Tests
    print("\n--- 6. Testing Security & Edge Cases ---")

    # Double payment prevention
    status, err = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_b}", method="POST")
    assert status in [400, 409], f"Double payment should fail with 409/400, got {status}"
    print(f"Double payment rejected with HTTP {status}: {err.get('message', err)}")

    # Creator paying themselves prevention
    status, err = req(f"{BASE_URL}/api/split-bills/{split_id}/pay?userId={user_a}", method="POST")
    assert status in [400, 409], f"Creator paying themselves should fail, got {status}"
    print(f"Self payment rejected with HTTP {status}: {err.get('message', err)}")

    # Split with yourself prevention
    status, err = req(f"{BASE_URL}/api/split-bills?userId={user_a}", method="POST", data={
        "totalAmount": 10.00,
        "note": "Self split",
        "friendIds": [user_a]
    })
    assert status == 400, f"Self split creation should fail with 400, got {status}"
    print(f"Self split bill creation rejected with HTTP {status}: {err.get('message', err)}")

    # Invalid amount <= 0
    status, err = req(f"{BASE_URL}/api/split-bills?userId={user_a}", method="POST", data={
        "totalAmount": 0.00,
        "note": "Zero split",
        "friendIds": [user_b]
    })
    assert status == 400, f"Zero amount split should fail with 400, got {status}"
    print(f"Zero amount split rejected with HTTP {status}: {err.get('message', err)}")

    print("\n==================================================")
    print("ALL SPLIT BILL ACCEPTANCE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_acceptance_test()
