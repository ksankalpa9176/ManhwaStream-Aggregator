#!/usr/bin/env python3
"""ArenaScan scraper — https://arenascan.com"""
from typing import List, Dict, Any
from .base_scraper import BaseScraper


class ArenaScanScraper(BaseScraper):
    def __init__(self):
        super().__init__("arenascan", "ArenaScan", "https://arenascan.com")

    def scrape_latest(self, pages: int = 5) -> List[Dict[str, Any]]:
        self.logger.info(f"Starting ArenaScan scrape (pages={pages})")
        results = []
        seen = set()

        for p in range(1, pages + 1):
            page_url = f"{self.base_url}/" if p == 1 else f"{self.base_url}/page/{p}/"
            soup = self.fetch_soup(page_url)
            if not soup:
                continue

            cards = soup.select(".bsx")
            self.logger.info(f"Page {p}: {len(cards)} cards")

            for card in cards:
                title_el = card.select_one(".tt") or card.select_one("a[title]")
                title = (title_el.get_text(strip=True) if title_el else "") or (
                    title_el.get("title") if title_el else ""
                )
                if not title:
                    continue

                canonical_slug = self.to_canonical_slug(title)

                series_link = card.select_one("a[href*='/manga/']") or card.select_one("a[href]")
                series_url = series_link["href"].strip() if series_link and "href" in series_link.attrs else ""
                if series_url.startswith("/"):
                    series_url = self.base_url + series_url

                # ArenaScan uses {slug}-{N}/ format (no "-chapter-")
                ch_link = (
                    card.select_one("a[href*='-chapter-']")
                    or card.select_one(".epxs a")
                    or card.select_one(".epxs")
                    or card.select_one("a[href]")
                )
                chapter_url = ""
                if ch_link:
                    if ch_link.name == "a" and "href" in ch_link.attrs:
                        chapter_url = ch_link["href"].strip()
                    else:
                        inner_a = ch_link.find("a") or ch_link.find_parent("a")
                        if inner_a and "href" in inner_a.attrs:
                            chapter_url = inner_a["href"].strip()
                if chapter_url.startswith("/"):
                    chapter_url = self.base_url + chapter_url

                ch_el = card.select_one(".epxs") or ch_link
                raw_ch = ch_el.get_text(strip=True) if ch_el else ""
                chapter_num = self.extract_chapter(chapter_url or raw_ch)

                img_el = card.select_one("img")
                cover_url = ""
                if img_el:
                    cover_url = (img_el.get("src") or img_el.get("data-src") or img_el.get("data-lazy-src") or "")
                    if cover_url.startswith("/"):
                        cover_url = self.base_url + cover_url

                key = (canonical_slug, chapter_num)
                if key in seen:
                    continue
                seen.add(key)
                results.append({
                    "canonical_slug": canonical_slug,
                    "title": title,
                    "chapter": chapter_num,
                    "chapter_url": chapter_url,
                    "series_url": series_url,
                    "cover_url": cover_url,
                    "source_id": self.source_id,
                    "source_name": self.name,
                })

        self.logger.info(f"ArenaScan: {len(results)} releases")
        return results
