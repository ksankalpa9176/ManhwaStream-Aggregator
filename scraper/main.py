#!/usr/bin/env python3
"""Incremental scraper — runs every 4 hours via GitHub Actions."""
import os
import sys
import json
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore

from scrapers.arenascan_scraper import ArenaScanScraper
from scrapers.kingofshojo_scraper import KingOfShojoScraper
from scrapers.roliascan_scraper import RoliaScanScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("main")


def init_firebase():
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not sa_json:
        logger.error("FIREBASE_SERVICE_ACCOUNT_JSON env var not set")
        sys.exit(1)
    sa_dict = json.loads(sa_json)
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_dict)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def write_batch_with_retry(db, payloads: List[Dict[str, Any]], max_retries: int = 3) -> int:
    written = 0
    for attempt in range(max_retries):
        try:
            batch = db.batch()
            for payload in payloads:
                doc_id = payload.pop("_doc_id")
                ref = db.collection("manhwa").document(doc_id)
                batch.set(ref, payload, merge=True)
            batch.commit()
            written = len(payloads)
            logger.info(f"  Batch OK ({written} docs, attempt {attempt + 1})")
            break
        except Exception as e:
            wait = 2 ** attempt
            logger.warning(f"  Batch failed (attempt {attempt + 1}): {e}. Retry in {wait}s")
            time.sleep(wait)
    return written


def write_to_firestore(db, merged: Dict[str, Dict[str, Any]]) -> Dict[str, int]:
    payloads = []
    for doc_id, payload in merged.items():
        p = dict(payload)
        p["_doc_id"] = doc_id
        p["last_seen"] = datetime.now(timezone.utc).isoformat()
        p["in_catalog"] = True
        payloads.append(p)

    stats = {"attempted": len(payloads), "written": 0, "failed": 0}
    BATCH_SIZE = 400
    for i in range(0, len(payloads), BATCH_SIZE):
        chunk = payloads[i : i + BATCH_SIZE]
        ok = write_batch_with_retry(db, chunk)
        stats["written"] += ok
        stats["failed"] += len(chunk) - ok
    logger.info(f"Firestore: {stats}")
    return stats


def merge_by_canonical_slug(all_releases: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for r in all_releases:
        grouped.setdefault(r["canonical_slug"], []).append(r)

    now_iso = datetime.now(timezone.utc).isoformat()
    merged: Dict[str, Dict[str, Any]] = {}

    for slug, releases in grouped.items():
        doc_id = slug.replace("-", "_")
        sample = releases[0]
        sources: Dict[str, Any] = {}
        highest = 0.0
        fastest_source = "arenascan"
        series_url = ""
        cover_url = ""

        for rel in releases:
            src = rel["source_id"]
            ch = rel["chapter"]
            rel_series_url = rel.get("series_url", "")

            sources[src] = {
                "chapter": ch,
                "chapter_text": f"Chapter {ch}",
                "series_url": rel_series_url,
                "updated_at": now_iso,
                "status": "active",
            }
            if ch > highest:
                highest = ch
                fastest_source = src
            if not series_url and rel_series_url:
                series_url = rel_series_url
            if not cover_url and rel.get("cover_url"):
                cover_url = rel["cover_url"]

        merged[doc_id] = {
            "title": sample["title"],
            "canonical_slug": slug,
            "latest_chapter": highest,
            "latest_chapter_text": f"Chapter {highest}",
            "fastest_source_id": fastest_source,
            "series_url": series_url,
            "cover_url": cover_url,
            "sources": sources,
            "updated_at": now_iso,
            "is_recent": True,
        }

    return merged


def reset_stale_recent_flags(db, recent_doc_ids):
    """Set is_recent=false on all manhwa docs NOT touched in this run."""
    try:
        docs = db.collection("manhwa").stream()
        batch = db.batch()
        count = 0
        total = 0

        for doc in docs:
            if doc.id in recent_doc_ids:
                continue
            data = doc.to_dict() or {}
            if data.get("is_recent") is True:
                batch.update(doc.reference, {"is_recent": False})
                count += 1
                total += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0

        if count > 0:
            batch.commit()
        logger.info(f"Reset is_recent=false on {total} stale docs")
    except Exception as e:
        logger.warning(f"Failed to reset stale is_recent flags: {e}")


def main():
    pages = int(os.environ.get("SCRAPER_PAGES", "5"))
    logger.info(f"=== Incremental scraper (pages={pages}, RoliaScan 200 max) ===")

    db = init_firebase()

    scrapers = [ArenaScanScraper(), KingOfShojoScraper(), RoliaScanScraper()]
    all_releases: List[Dict[str, Any]] = []
    reports = []

    for scraper in scrapers:
        try:
            logger.info(f"> {scraper.name}...")
            items = scraper.scrape_latest(pages=pages)
            if len(items) == 0:
                logger.warning(f"  ! {scraper.name}: 0 results")
                reports.append({"source": scraper.name, "status": "empty", "count": 0})
                continue
            logger.info(f"  OK {scraper.name}: {len(items)} releases")
            all_releases.extend(items)
            reports.append({"source": scraper.name, "status": "ok", "count": len(items)})
        except Exception as e:
            logger.error(f"  X {scraper.name} failed: {e}")
            reports.append({"source": scraper.name, "status": "error", "error": str(e)})

    logger.info(f"Total releases: {len(all_releases)}")

    write_stats = {"attempted": 0, "written": 0, "failed": 0}
    recent_doc_ids = set()
    if all_releases:
        merged = merge_by_canonical_slug(all_releases)
        logger.info(f"Unique series: {len(merged)}")
        write_stats = write_to_firestore(db, merged)
        recent_doc_ids = set(merged.keys())
        reset_stale_recent_flags(db, recent_doc_ids)
    else:
        logger.warning("No releases — skipping Firestore write")

    db.collection("sources").document("health").set({
        "last_run": datetime.now(timezone.utc).isoformat(),
        "reports": reports,
        "write_stats": write_stats,
        "mode": "incremental",
    }, merge=True)

    ok = [r for r in reports if r["status"] == "ok"]
    if not ok:
        logger.error("ALL scrapers failed")
        sys.exit(1)

    logger.info("=== Done ===")


if __name__ == "__main__":
    main()
