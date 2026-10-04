import pathlib
import re

# ============================================================
# FIX 1: ArenaScan pagination in full_scan.py
# ============================================================
p = pathlib.Path('scraper/full_scan.py')
src = p.read_text(encoding='utf-8')

old = '''url = f"{base}/manga/" if page == 1 else f"{base}/manga/page/{page}/"'''
new = '''url = f"{base}/" if page == 1 else f"{base}/page/{page}/"'''

if old in src:
    src = src.replace(old, new, 1)
    p.write_text(src, encoding='utf-8')
    print("OK - ArenaScan pagination fixed in full_scan.py")
else:
    print("WARN - ArenaScan pagination pattern not found in full_scan.py")

# ============================================================
# FIX 2: ArenaScan pagination in incremental scraper
# ============================================================
p = pathlib.Path('scraper/scrapers/arenascan_scraper.py')
src = p.read_text(encoding='utf-8')

old = '''            page_url = f"{self.base_url}/" if p == 1 else f"{self.base_url}/page/{p}/"'''
if old in src:
    print("OK - ArenaScan incremental scraper already uses correct pattern")
else:
    # Try alternate pattern
    old2 = '''page_url = f"{self.base_url}/manga/" if p == 1 else f"{self.base_url}/manga/page/{p}/"'''
    new2 = '''page_url = f"{self.base_url}/" if p == 1 else f"{self.base_url}/page/{p}/"'''
    if old2 in src:
        src = src.replace(old2, new2, 1)
        p.write_text(src, encoding='utf-8')
        print("OK - ArenaScan incremental pagination fixed")
    else:
        print("WARN - ArenaScan incremental pagination pattern not found")

# ============================================================
# FIX 3: RoliaScan — rewrite scraper with href-based matching
# ============================================================
p = pathlib.Path('scraper/scrapers/roliascan_scraper.py')
src = p.read_text(encoding='utf-8')

# Replace the _parse_cards method entirely
new_parse = '''    def _parse_cards(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Parse RoliaScan HTML — finds all series links by href pattern."""
        results = []
        seen_slugs = set()

        # Find every anchor pointing at a series page
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            if not href.startswith("/manga/") and "roliascan.com/manga/" not in href:
                continue

            # Normalize to absolute
            if href.startswith("/"):
                series_url = self.base_url + href
            else:
                series_url = href

            # Extract slug from URL
            m = re.search(r"/manga/([^/?#]+)", series_url)
            if not m:
                continue
            slug = m.group(1)
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)

            # Try to find title text — the anchor itself, or the closest h2/h3/h4
            title = a.get_text(strip=True)
            if not title or len(title) < 2:
                # Look for a nearby heading
                parent = a.find_parent(["div", "article", "li"])
                if parent:
                    h = parent.find(["h2", "h3", "h4"])
                    if h:
                        title = h.get_text(strip=True)
            if not title or len(title) < 2:
                # Fallback: derive from slug
                title = slug.replace("-", " ").title()

            canonical_slug = self.to_canonical_slug(title)

            # Try to extract chapter number from nearby text
            chapter_num = 1.0
            parent = a.find_parent(["div", "article", "li"])
            if parent:
                ch_match = re.search(r"(?:chapter|ch\\.?)\\s*(\\d+(?:\\.\\d+)?)", parent.get_text(), re.IGNORECASE)
                if ch_match:
                    try:
                        chapter_num = float(ch_match.group(1))
                    except ValueError:
                        pass

            # Find cover image near this link
            cover_url = ""
            img_scope = a.find_parent(["div", "article", "li"]) or a
            img = img_scope.find("img")
            if img:
                cover_url = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
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
'''

# Find the old _parse_cards and replace it
pattern = re.compile(
    r"    def _parse_cards\(self, soup: BeautifulSoup\) -> List\[Dict\[str, Any\]\]:[\s\S]*?(?=\n    def |\nclass |\Z)",
    re.MULTILINE
)
new_src, count = pattern.subn(new_parse, src, count=1)

if count > 0:
    # Also ensure 're' is imported
    if not new_src.strip().startswith("import re") and "import re" not in new_src.split("\n")[0:5]:
        new_src = "import re\n" + new_src
    p.write_text(new_src, encoding='utf-8')
    print("OK - RoliaScan scraper rewritten with href-based parsing")
else:
    print("WARN - RoliaScan _parse_cards pattern not found")
    idx = src.find("def _parse_cards")
    if idx > 0:
        print("   Current content (first 500 chars):")
        print(src[idx:idx + 500])

print("Done")
