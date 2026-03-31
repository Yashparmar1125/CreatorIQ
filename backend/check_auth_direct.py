import httpx

def check_auth_direct():
    print("Checking Auth Service Direct Redirect...")
    try:
        with httpx.Client(timeout=5.0) as client:
            # Hit auth:8001 directly with an error param to trigger a redirect
            r = client.get("http://localhost:8001/auth/google/callback", params={"error": "test_error"}, follow_redirects=False)
            print(f"Auth Direct Status: {r.status_code}")
            print(f"Auth Direct Headers: {dict(r.headers)}")
            print(f"Auth Direct Location: {r.headers.get('location')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_auth_direct()
