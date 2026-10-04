#!/usr/bin/env python3
"""ONE-TIME full catalog scan — run once via workflow_dispatch."""
import os
import sys
import json
import time
import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Set

import firebase_admin
from firebase_admin import credentials, firestore
import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("full_scan")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}
MAX_PAGES = int(os.environ.get("FULL_SCAN_MAX_PAGES", "200"))


def init_firebase():
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not sa_json:
        sys.exit(1)
    sa_dict = json.loads(sa_json)
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_dict)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def to_canonical_slug(title: str) -> str:
    if not title:
        return "manhwa"
    t = re.sub(r"\[.*?\]|\(.*?\)", "", title.lower())
    t = re.sub(r"season\s*\d+", "", t, flags=re.IGNORECASE)
    t = re.sub(r"['\u2019]", "", t)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or "manhwa"


def scan_arenascan() -> List[Dict[str, Any]]:
    base = "https://arenascan.com"
    results = []
    seen: Set[str] = set()
    for page in range(1, MAX_PAGES + 1):
        url = f"{base}/" if page == 1 else f"{base}/page/{page}/"
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                break
            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.select(".bsx, .page-item-detail")
            if not cards:
                break
            new = 0
            for card in cards:
                t_el = card.select_one(".tt") or card.select_one("a[title]")
                if not t_el:
                    continue
                title = t_el.get_text(strip=True) or t_el.get("title", "")
                slug = to_canonical_slug(title)
                if slug in seen:
                    continue
                seen.add(slug)
                s_el = card.select_one("a[href*='/manga/']") or card.select_one("a[href]")
                series_url = s_el["href"] if s_el and "href" in s_el.attrs else ""
                if series_url.startswith("/"):
                    series_url = base + series_url
                img_el = card.select_one("img")
                cover = ""
                if img_el:
                    cover = img_el.get("src") or img_el.get("data-src") or ""
                    if cover.startswith("/"):
                        cover = base + cover
                results.append({"canonical_slug": slug, "title": title, "series_url": series_url, "cover_url": cover, "source_id": "arenascan", "source_name": "ArenaScan"})
                new += 1
            logger.info(f"ArenaScan page {page}: +{new} (total {len(results)})")
            if new == 0:
                break
            time.sleep(0.4)
        except Exception as e:
            logger.warning(f"ArenaScan page {page}: {e}")
            break
    return results


def scan_kingofshojo() -> List[Dict[str, Any]]:
    base = "https://kingofshojo.com"
    results = []
    seen: Set[str] = set()
    for page in range(1, MAX_PAGES + 1):
        url = f"{base}/" if page == 1 else f"{base}/page/{page}/"
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                break
            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.select(".bsx, .page-item-detail, .utao, .listupd .bs")
            if not cards:
                break
            new = 0
            for card in cards:
                t_el = card.select_one(".tt") or card.select_one("h3 a") or card.select_one("a[title]")
                if not t_el:
                    continue
                title = t_el.get_text(strip=True) or t_el.get("title", "")
                slug = to_canonical_slug(title)
                if slug in seen:
                    continue
                seen.add(slug)
                s_el = card.select_one("a[href*='/manga/']") or card.select_one("a[href]")
                series_url = s_el["href"] if s_el and "href" in s_el.attrs else ""
                if series_url.startswith("/"):
                    series_url = base + series_url
                img_el = card.select_one("img")
                cover = ""
                if img_el:
                    cover = img_el.get("src") or img_el.get("data-src") or ""
                    if cover.startswith("/"):
                        cover = base + cover
                results.append({"canonical_slug": slug, "title": title, "series_url": series_url, "cover_url": cover, "source_id": "kingofshojo", "source_name": "King of Shojo"})
                new += 1
            logger.info(f"KoS page {page}: +{new} (total {len(results)})")
            if new == 0:
                break
            time.sleep(0.4)
        except Exception as e:
            logger.warning(f"KoS page {page}: {e}")
            break
    return results


def scan_roliascan() -> List[Dict[str, Any]]:
    """Use the RoliaScanScraper class (JSON API based)."""
    from scrapers.roliascan_scraper import RoliaScanScraper
    scraper = RoliaScanScraper()
    items = scraper.scrape_latest(pages=20)  # up to 200 titles
    return [
        {
            "canonical_slug": it["canonical_slug"],
            "title": it["title"],
            "series_url": it["series_url"],
            "cover_url": it["cover_url"],
            "source_id": it["source_id"],
            "source_name": it["source_name"],
        }
        for it in items
    ]


def write_catalog_entries(db, items: List[Dict[str, Any]]):
    if not items:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    batch = db.batch()
    count = 0
    written = 0
    for item in items:
        doc_id = item["canonical_slug"].replace("-", "_")
        ref = db.collection("manhwa").document(doc_id)
        batch.set(ref, {
            "title": item["title"],
            "canonical_slug": item["canonical_slug"],
            "series_url": item["series_url"],
            "cover_url": item["cover_url"],
            "catalog_source_id": item["source_id"],
            "catalog_source_name": item["source_name"],
            "in_catalog": True,
            "last_catalog_scan": now_iso,
        }, merge=True)
        count += 1
        written += 1
        if count >= 400:
            batch.commit()
            logger.info(f"Committed batch ({written} total)")
            batch = db.batch()
            count = 0
    if count > 0:
        batch.commit()
    logger.info(f"Full scan wrote {written} entries")


def main():
    logger.info("=== FULL CATALOG SCAN ===")
    db = init_firebase()
    all_items = []
    for name, fn in [("ArenaScan", scan_arenascan), ("King of Shojo", scan_kingofshojo), ("RoliaScan", scan_roliascan)]:
        try:
            logger.info(f"> {name}...")
            items = fn()
            logger.info(f"  OK {name}: {len(items)} titles")
            all_items.extend(items)
        except Exception as e:
            logger.error(f"  X {name} failed: {e}")

    deduped: Dict[str, Dict[str, Any]] = {}
    for item in all_items:
        slug = item["canonical_slug"]
        if slug not in deduped:
            deduped[slug] = item
        else:
            ex = deduped[slug]
            if not ex.get("series_url") and item.get("series_url"):
                ex["series_url"] = item["series_url"]
            if not ex.get("cover_url") and item.get("cover_url"):
                ex["cover_url"] = item["cover_url"]

    logger.info(f"Total after dedup: {len(deduped)}")
    write_catalog_entries(db, list(deduped.values()))
    logger.info("=== Done ===")


if __name__ == "__main__":
    main()
