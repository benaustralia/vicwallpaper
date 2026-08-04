#!/usr/bin/env python3
"""
Upload prepared vicwallpaper images (see scripts/prep-r2-images.py) to the
`vicwallpaper-assets` Cloudflare R2 bucket via the REST API. Reads
credentials from .env.r2.local (gitignored; CF_ACCOUNT_ID + CF_API_TOKEN).
"""
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

REPO_ROOT = Path(__file__).parent.parent
OUT_DIR = Path(__file__).parent / "r2_images"
BUCKET = "vicwallpaper-assets"


def read_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


def upload_one(pair, account_id, api_token, session, max_retries=4):
    local_path, object_key = pair
    base_url = "https://api.cloudflare.com/client/v4"
    for attempt in range(1, max_retries + 1):
        try:
            data = local_path.read_bytes()
            url = f"{base_url}/accounts/{account_id}/r2/buckets/{BUCKET}/objects/{object_key}"
            headers = {
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "image/jpeg",
            }
            resp = session.put(url, data=data, headers=headers, timeout=30)
            if resp.status_code == 200:
                return (object_key, True, None)
            err = f"HTTP {resp.status_code}: {resp.text[:200]}"
            if attempt == max_retries:
                return (object_key, False, err)
        except Exception as e:
            err = str(e)
            if attempt == max_retries:
                return (object_key, False, err)
        time.sleep(2 * attempt)
    return (object_key, False, "max retries exceeded")


def main():
    env_path = REPO_ROOT / ".env.r2.local"
    if not env_path.exists():
        print(f"Error: {env_path} not found")
        sys.exit(1)
    env = read_env(env_path)
    account_id = env.get("CF_ACCOUNT_ID")
    api_token = env.get("CF_API_TOKEN")
    if not account_id or not api_token:
        print("Error: CF_ACCOUNT_ID or CF_API_TOKEN not found in .env.r2.local")
        sys.exit(1)

    files = []
    for jpg in sorted(OUT_DIR.rglob("*.jpg")):
        rel = jpg.relative_to(OUT_DIR)
        files.append((jpg, f"images/{rel.as_posix()}"))

    print(f"Found {len(files)} files to upload")

    succeeded = 0
    failed = []
    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=8) as ex:
            futures = [ex.submit(upload_one, f, account_id, api_token, session) for f in files]
            for i, fut in enumerate(as_completed(futures), 1):
                key, ok, err = fut.result()
                if ok:
                    succeeded += 1
                else:
                    failed.append((key, err))
                if i % 25 == 0 or i == len(files):
                    print(f"  {i}/{len(files)} done ({succeeded} ok, {len(failed)} failed)")

    print(f"\n=== SUMMARY ===")
    print(f"Total: {len(files)}  Succeeded: {succeeded}  Failed: {len(failed)}")
    for key, err in failed:
        print(f"  FAILED {key}: {err}")

    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
