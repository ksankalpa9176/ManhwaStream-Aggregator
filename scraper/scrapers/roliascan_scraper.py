#!/usr/bin/env python3
"""
RoliaScan scraper — https://roliascan.com
- Fetches first N titles only (default 200).
- ALWAYS returns series URL, never chapter URL, because RoliaScan
  chapter permalinks are unstable.
"""
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper


class RoliaScanScraper(BaseScraper):
    MAX_TITLES = 200

    def __init__(self):
        super().__init__("roliascan", "RoliaScan", "https://roliascan.com")
        self.ajax_url = f"{self.base_url}/wp-admin/admin-ajax.php"

    def _parse_cards(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        results = []
        cards = soup.select(".page-item-detail, .manga-item, .bsx, article, .item-summary, .badge-pos-1")
        if not cards:
            cards = soup.select(".col-6, .col-md-3, .col-sm-4")

        for card in cards:
            title_el = (
                card.select_one("h3 a")
                or card.select_one("h4 a")
                or card.select_one(".post-title a")
                or card.select_one("a[title]")
                or card.select_one(".tt")
            )
            title = (title_el.get_text(strip=True) if title_el else "") or (
                title_el.get("title") if title_el else ""
            )
            if not title:
                continue

            canonical_slug = self.to_canonical_slug(title)

            series_url = title_el.get("href", "").strip() if title_el else ""
            if not series_url:
                s_el = card.select_one("a[href*='/manga/']")
                series_url = s_el.get("href", "").strip() if s_el else ""
            if series_url.startswith("/"):
                series_url = self.base_url + series_url

            ch_link = (
                card.select_one("a[href*='/chapter-']")
                or card.select_one("a[href*='-chapter-']")
                or card.select_one(".chapter-item a")
                or card.select_one(".chapter a")
            )
            raw_ch = ch_link.get_text(strip=True) if ch_link else ""
            chapter_num = self.extract_chapter(raw_ch)

            final_url = series_url or f"{self.base_url}/manga/{canonical_slug}/"

            img_el = card.select_one("img")
            cover_url = ""
            if img_el:
                cover_url = (img_el.get("src") or img_el.get("data-src") or img_el.get("data-lazy-src") or "")
                if cover_url.startswith("/"):
                    cover_url = self.base_url + cover_url

            results.append({
                "canonical_slug": canonical_slug,
                "title": title,
                "chapter": chapter_num,
                "chapter_url": final_url,
                "series_url": final_url,
                "cover_url": cover_url,
                "source_id": self.source_id,
                "source_name": self.name,
                "is_series_direct": True,
            })
        return results

    def scrape_latest(self, pages: int = 5) -> List[Dict[str, Any]]:
        self.logger.info(f"Starting RoliaScan scrape (max {self.MAX_TITLES} titles)")
        results = []
        seen = set()

        def _add_items(items):
            for it in items:
                key = it["canonical_slug"]
                if key in seen:
                    continue
                seen.add(key)
                results.append(it)
                if len(results) >= self.MAX_TITLES:
                    return True
            return False

        soup = self.fetch_soup(f"{self.base_url}/home/")
        if not soup:
            soup = self.fetch_soup(f"{self.base_url}/")

        if soup:
            if _add_items(self._parse_cards(soup)):
                self.logger.info(f"Reached {self.MAX_TITLES} titles from homepage")
                return results[:self.MAX_TITLES]

        page_num = 1
        max_ajax_pages = 30
        while len(results) < self.MAX_TITLES and page_num <= max_ajax_pages:
            try:
                payload = {
                    "action": "madara_load_more",
                    "page": page_num,
                    "template": "madara-core/content/content-archive",
                    "vars[paged]": page_num + 1,
                    "vars[post_type]": "wp-manga",
                    "vars[orderby]": "latest",
                }
                res = self.session.post(self.ajax_url, data=payload, timeout=12)
                if res.status_code == 200 and len(res.text.strip()) > 50:
                    ajax_soup = BeautifulSoup(res.text, "html.parser")
                    if _add_items(self._parse_cards(ajax_soup)):
                        break
                    page_num += 1
                else:
                    break
            except Exception as e:
                self.logger.warning(f"RoliaScan loadmore {page_num} failed: {e}")
                break

        self.logger.info(f"RoliaScan: {len(results)} titles")
        return results[:self.MAX_TITLES]
