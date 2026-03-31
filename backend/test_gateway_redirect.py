import httpx
import sys

def test_gateway():
    print("Testing Gateway Redirection Proxying...")
    # Use a dummy path that we know will hit the gateway
    # Actually, let's hit the health endpoint through the gateway first
    try:
        with httpx.Client(timeout=5.0) as client:
            # We don't have a guaranteed 302 path without mocking, 
            # but we can check if headers are forwarded on health
            r = client.get("http://localhost:8000/v1/auth/health")
            print(f"Health Status: {r.status_code}")
            print(f"Headers: {dict(r.headers)}")
            
            # Now let's try to simulate a callback (it will fail at token exchange but should 302 to login)
            r2 = client.get("http://localhost:8000/v1/auth/google/callback", params={"error": "test_error"}, follow_redirects=False)
            print(f"Callback Redirect Status: {r2.status_code}")
            print(f"Redirect Location: {r2.headers.get('location')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gateway()
