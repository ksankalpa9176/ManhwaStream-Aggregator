#!/usr/bin/env python3
"""
RoliaScan scraper — https://roliascan.com
Uses the public JSON API at /wp-json/manga/v1/latest-chapters.
Supports infinite scroll via page parameter. Returns SERIES URLs only.
"""
import re
import json
from typing import List, Dict, Any
from .base_scraper import BaseScraper


class RoliaScanScraper(BaseScraper):
    MAX_TITLES = 200
    API_URL = "https://roliascan.com/wp-json/manga/v1/latest-chapters"

    def __init__(self):
        super().__init__("roliascan", "RoliaScan", "https://roliascan.com")

    def _extract_chapter_number(self, chapter_text: str) -> float:
        """Extract numeric chapter from strings like 'Ch. 44' or 'Chapter 44.5'."""
        if not chapter_text:
            return 1.0
        m = re.search(r"(\d+(?:\.\d+)?)", chapter_text)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
        return 1.0

    def _fetch_page(self, page: int) -> List[Dict[str, Any]]:
        """Fetch one page of latest chapters from the JSON API."""
        url = f"{self.API_URL}?page={page}"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            res = self.session.post(url, headers=headers, json={}, timeout=15)
            if res.status_code != 200:
                self.logger.warning(f"Page {page}: HTTP {res.status_code}")
                return []
            data = res.json()
            if not data.get("success"):
                return []
            return data.get("data", []) or []
        except Exception as e:
            self.logger.warning(f"Page {page} fetch failed: {e}")
            return []

    def scrape_latest(self, pages: int = 5) -> List[Dict[str, Any]]:
        self.logger.info(f"Starting RoliaScan scrape via JSON API (max {self.MAX_TITLES})")

        results: List[Dict[str, Any]] = []
        seen_slugs = set()

        for page in range(1, pages + 1):
            items = self._fetch_page(page)
            if not items:
                self.logger.info(f"  Page {page}: no items — stopping")
                break

            added = 0
            for item in items:
                title = (item.get("title") or "").strip()
                series_url = (item.get("manga_permalink") or "").strip()
                cover_url = (item.get("cover") or "").strip()

                if not title or not series_url:
                    continue

                # Validate: must be a series URL, not a chapter URL
                if "/read/" in series_url or "-chapter-" in series_url:
                    self.logger.warning(f"Skipping chapter URL (expected series URL): {series_url}")
                    continue

                # Normalize relative URLs
                if series_url.startswith("/"):
                    series_url = self.base_url + series_url

                # Extract canonical slug
                m = re.search(r"/manga/([^/?#]+)", series_url)
                if not m:
                    continue
                slug = m.group(1)

                if slug in seen_slugs:
                    continue
                seen_slugs.add(slug)

                chapter_num = self._extract_chapter_number(item.get("chapter", ""))

                results.append({
                    "canonical_slug": slug,
                    "title": title,
                    "chapter": chapter_num,
                    "series_url": series_url,
                    "cover_url": cover_url,
                    "source_id": self.source_id,
                    "source_name": self.name,
                })
                added += 1

                if len(results) >= self.MAX_TITLES:
                    break

            self.logger.info(f"  Page {page}: +{added} (total {len(results)})")

            if len(results) >= self.MAX_TITLES:
                break

        self.logger.info(f"RoliaScan: {len(results)} titles")
        return results[:self.MAX_TITLES]
