                    ┌──────────────────────┐
                    │      YOUR FRONTEND   │
                    │   localhost:5173     │
                    └──────────┬───────────┘
                               │
                    1. "Login with Google"
                               │
                               ▼
                    ┌──────────────────────┐
                    │    YOUR BACKEND      │
                    │   localhost:8000     │
                    └──────────┬───────────┘
                               │
                  2. SDK/config se OAuth URL
                               │
                               ▼
                    ┌──────────────────────┐
                    │   GOOGLE AUTH SERVER │
                    └──────────┬───────────┘
                               │
                       3. User Login
                               │
                       4. User → Allow
                               │
                               ▼
                    Google creates AUTH CODE
                               │
                     5. HTTP 302 Redirect
                               │
                               ▼
Browser → localhost:8000/callback?code=ABC&state=XYZ
                               │
                               ▼
                    ┌──────────────────────┐
                    │    YOUR BACKEND      │
                    └──────────┬───────────┘
                               │
                     6. Verify state
                               │
                     7. Send code to Google
                               │
                               ▼
                    Google Token Endpoint
                               │
                    8. Access + Refresh Token
                               │
                               ▼
                    ┌──────────────────────┐
                    │    YOUR BACKEND      │
                    └──────────┬───────────┘
                               │
                9. Access Token se Google APIs
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
       Google UserInfo                     YouTube API
              │                                 │
        Email/Profile                     Channel Stats
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                         Your Database
                               │
                               ▼
                    Create Your Session/JWT
                               │
                               ▼
                         YOUR FRONTEND