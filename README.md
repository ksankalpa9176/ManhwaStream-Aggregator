# ManhwaStream Aggregator

A smart manhwa reading tracker with sequential chapter catch-up.

## Architecture

- **Firebase Firestore** — public scraper data (manhwa catalog)
- **Supabase** — user accounts + personal reading lists
- **GitHub Pages** — hosts the React SPA
- **GitHub Actions** — runs the Python scraper every 4 hours

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS 4
- Firebase SDK (Firestore reads)
- Supabase JS (auth + watchlist)
- Python 3.11 + BeautifulSoup + firebase-admin (scraper)

## Setup

See the full setup guide in the project documentation.

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full service account JSON (minified) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `VITE_FIREBASE_API_KEY` | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `VITE_FIREBASE_APP_ID` | Firebase config |

## Local Development

```bash
npm install
npm run dev
