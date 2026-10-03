#!/usr/bin/env python3
"""Base scraper blueprint for all sources."""
import re
import logging
import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


class BaseScraper(ABC):
    def __init__(self, source_id: str, name: str, base_url: str):
        self.source_id = source_id
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.logger = logging.getLogger(f"Scraper.{name}")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })

    @staticmethod
    def to_canonical_slug(title: str) -> str:
        if not title:
            return "manhwa"
        t = title.lower().strip()
        t = t.replace("\u2018", "'").replace("\u2019", "'")
        t = t.replace("\u201c", '"').replace("\u201d", '"')
        t = t.replace("\u2013", "-").replace("\u2014", "-")
        t = t.replace("\u2026", "...")
        t = re.sub(r"\[.*?\]|\(.*?\)", "", t)
        t = re.sub(r"\b(season|part|vol|volume|chapter|ch|ep|episode)\s*\d+", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\b(official|manhwa|manhua|manga|webtoon|scan|scans|translated|translation)\b", "", t, flags=re.IGNORECASE)
        t = re.sub(r"^(the|a|an)\s+", "", t)
        t = re.sub(r"['\"`]", "", t)
        t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
        return t or "manhwa"

    @staticmethod
    def extract_chapter(text_or_url: str) -> float:
        if not text_or_url:
            return 1.0
        m_url = re.search(r"-chapter-(\d+(?:[.-]\d+)?)/?", text_or_url, re.IGNORECASE)
        if m_url:
            try:
                return float(m_url.group(1).replace("-", "."))
            except ValueError:
                pass
        m_text = re.search(r"(?:chapter|ch\.?|ep\.?)\s*(\d+(?:\.\d+)?)", text_or_url, re.IGNORECASE)
        if m_text:
            try:
                return float(m_text.group(1))
            except ValueError:
                pass
        m_num = re.search(r"\b(\d+(?:\.\d+)?)\b", text_or_url)
        if m_num:
            try:
                return float(m_num.group(1))
            except ValueError:
                pass
        return 1.0

    def fetch_soup(self, url: str, timeout: int = 15) -> Optional[BeautifulSoup]:
        try:
            res = self.session.get(url, timeout=timeout)
            if res.status_code == 200:
                return BeautifulSoup(res.text, "html.parser")
            self.logger.warning(f"HTTP {res.status_code} for {url}")
        except Exception as e:
            self.logger.error(f"Network error fetching {url}: {e}")
        return None

    @abstractmethod
    def scrape_latest(self, pages: int = 2) -> List[Dict[str, Any]]:
        pass
