import pathlib

p = pathlib.Path('scraper/scrapers/roliascan_scraper.py')

new_content = '''#!/usr/bin/env python3
"""
RoliaScan scraper — https://roliascan.com
Modern React/Tailwind site (not Madara). Uses href-based parsing.
Always returns series URLs (chapter links are unstable).
"""
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper


class RoliaScanScraper(BaseScraper):
    MAX_TITLES = 200

    def __init__(self):
        super().__init__("roliascan", "RoliaScan", "https://roliascan.com")

    def _parse_cards(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Find every anchor that points at /manga/{slug}."""
        results = []
        seen_slugs = set()

        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            if "/manga/" not in href:
                continue
            if "roliascan.com/manga/" not in href and not href.startswith("/manga/"):
                continue

            # Normalize to absolute URL
            if href.startswith("/"):
                series_url = self.base_url + href
            else:
                series_url = href

            # Extract slug
            m = re.search(r"/manga/([^/?#]+)", series_url)
            if not m:
                continue
            slug = m.group(1)
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)

            # Try to find title text
            title = a.get_text(strip=True)
            if not title or len(title) < 2:
                parent = a.find_parent(["div", "article", "li", "section"])
                if parent:
                    h = parent.find(["h1", "h2", "h3", "h4"])
                    if h:
                        title = h.get_text(strip=True)
            if not title or len(title) < 2:
                title = slug.replace("-", " ").title()

            canonical_slug = self.to_canonical_slug(title)

            # Try to extract chapter number from parent text
            chapter_num = 1.0
            parent = a.find_parent(["div", "article", "li", "section"])
            if parent:
                ch_match = re.search(
                    r"(?:chapter|ch\\.?)\\s*(\\d+(?:\\.\\d+)?)",
                    parent.get_text(),
                    re.IGNORECASE,
                )
                if ch_match:
                    try:
                        chapter_num = float(ch_match.group(1))
                    except ValueError:
                        pass

            # Find cover image near the link
            cover_url = ""
            img_scope = parent or a
            img = img_scope.find("img")
            if img:
                cover_url = (
                    img.get("src")
                    or img.get("data-src")
                    or img.get("data-lazy-src")
                    or ""
                )
                if cover_url.startswith("/"):
                    cover_url = self.base_url + cover_url

            results.append({
                "canonical_slug": canonical_slug,
                "title": title,
                "chapter": chapter_num,
                "series_url": series_url,
                "cover_url": cover_url,
                "source_id": self.source_id,
                "source_name": self.name,
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

        # Try multiple entry points since site structure changed
        for entry in [f"{self.base_url}/home/", f"{self.base_url}/", f"{self.base_url}/manga/"]:
            soup = self.fetch_soup(entry)
            if soup:
                added = _add_items(self._parse_cards(soup))
                self.logger.info(f"  {entry} → {len(results)} titles so far")
                if added:
                    break
            if len(results) >= self.MAX_TITLES:
                break

        self.logger.info(f"RoliaScan: {len(results)} titles")
        return results[:self.MAX_TITLES]
'''

p.write_text(new_content, encoding='utf-8')
print("OK - RoliaScan scraper rewritten")

# Syntax check
import ast
ast.parse(new_content)
print("OK - syntax valid")
