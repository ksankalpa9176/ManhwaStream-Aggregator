import os
import sys
import time
import firebase_admin
from firebase_admin import credentials, firestore

# Load service account from env or file
sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
sa_file = os.path.expanduser("~/Desktop/firebase-service-account.json")

if sa_json:
    import json
    cred = credentials.Certificate(json.loads(sa_json))
elif os.path.exists(sa_file):
    cred = credentials.Certificate(sa_file)
else:
    # Try common locations
    candidates = [
        os.path.expanduser("~/Documents/ManhwaStream-Aggregator/firebase-service-account.json"),
        os.path.expanduser("~/firebase-service-account.json"),
        "firebase-service-account.json",
    ]
    found = None
    for c in candidates:
        if os.path.exists(c):
            found = c
            break
    if not found:
        print("❌ Service account JSON not found.")
        print("   Set FIREBASE_SERVICE_ACCOUNT_JSON env var, OR")
        print("   save it as ~/Desktop/firebase-service-account.json")
        sys.exit(1)
    cred = credentials.Certificate(found)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

print("Fetching docs in manhwa/ ...")
col = db.collection("manhwa")
docs = [d.reference for d in col.stream()]
total = len(docs)
print(f"Found {total} docs")

if total == 0:
    print("✅ Collection is already empty")
    sys.exit(0)

BATCH_SIZE = 200
deleted = 0

for i in range(0, total, BATCH_SIZE):
    chunk = docs[i:i + BATCH_SIZE]
    batch = db.batch()
    for ref in chunk:
        batch.delete(ref)
    try:
        batch.commit()
        deleted += len(chunk)
        print(f"Deleted {deleted}/{total}")
    except Exception as e:
        print(f"Batch error at {deleted}: {e}")
        time.sleep(2)
    time.sleep(0.5)

print(f"\n✅ Done. Deleted {deleted} docs.")
