import os
import serpapi

client = serpapi.Client(api_key="f82c5216560ea23b9f7dfdfdb5c75af7e6a3b903c8e3daae0155a9f0c0c55e31")
results = client.search({
  "engine": "google",
  "q": "Entertainment"
})

print(results)