#!/usr/bin/env python3
"""King of Shojo scraper — https://kingofshojo.com"""
from typing import List, Dict, Any
from .base_scraper import BaseScraper


class KingOfShojoScraper(BaseScraper):
    def __init__(self):
        super().__init__("kingofshojo", "King of Shojo", "https://kingofshojo.com")

    def scrape_latest(self, pages: int = 5) -> List[Dict[str, Any]]:
        self.logger.info(f"Starting KingOfShojo scrape (pages={pages})")
        results = []
        seen = set()

        for p in range(1, pages + 1):
            page_url = f"{self.base_url}/" if p == 1 else f"{self.base_url}/page/{p}/"
            soup = self.fetch_soup(page_url)
            if not soup:
                continue

            cards = soup.select(".bsx, .page-item-detail, .utao, article.fancydown, .listupd .bs")
            if not cards:
                cards = soup.select(".manga, .post-item, .item-summary")
            self.logger.info(f"Page {p}: {len(cards)} cards")

            for card in cards:
                title_el = (
                    card.select_one(".tt")
                    or card.select_one("h3 a")
                    or card.select_one("h4 a")
                    or card.select_one("a[title]")
                )
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

                ch_link = (
                    card.select_one("a[href*='-chapter-']")
                    or card.select_one("a[href*='/chapter-']")
                )
                chapter_url = ""
                raw_ch = ""
                if ch_link:
                    chapter_url = ch_link.get("href", "").strip()
                    raw_ch = ch_link.get_text(strip=True)
                if chapter_url.startswith("/"):
                    chapter_url = self.base_url + chapter_url

                chapter_num = self.extract_chapter(chapter_url or raw_ch)

                if not chapter_url:
                    suffix = str(int(chapter_num)) if chapter_num == int(chapter_num) else str(chapter_num).replace(".", "-")
                    chapter_url = f"{self.base_url}/{canonical_slug}-chapter-{suffix}/"

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

        self.logger.info(f"KingOfShojo: {len(results)} releases")
        return results
