import sys
import os

# Add the service to path
service_path = r"c:\Users\Yash\VS_PROJECTS\CreatorIQ\backend\services\auth"
sys.path.append(service_path)

try:
    from app.core.config import settings
    print(f"Service Name: {settings.service_name}")
    print(f"Database URL (partial): {settings.database_url[:20]}...")
    print(f"JWT Public Key Path: {settings.jwt_public_key_path}")
    
    expected_db_prefix = "postgresql+asyncpg://"
    if settings.database_url.startswith(expected_db_prefix):
        print("SUCCESS: Database URL correctly loaded from global .env")
    else:
        print("FAILURE: Database URL not loaded correctly")
        
    if "CreatorIQ/backend/secrets" in settings.jwt_public_key_path:
         print("SUCCESS: JWT path correctly loaded from global .env (Windows path)")
    else:
         print(f"FAILURE: JWT path mismatch. Got: {settings.jwt_public_key_path}")

except Exception as e:
    print(f"Error during verification: {e}")
