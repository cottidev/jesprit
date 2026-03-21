# Jesprit

Jesprit is a minimalist, privacy-first journaling app built with vanilla JavaScript, Tailwind via CDN, and local browser storage.

It is designed to feel calm, premium, and distraction-free:
- no accounts
- no backend
- no cloud sync
- fast local writing
- installable as a PWA

## Features

- Create, edit, and delete journal entries
- Auto-save entries to `localStorage`
- Search entries by title or content
- Dark and light mode with saved preference
- Focus mode for distraction-free writing
- Rich text styling for selected text
- Mobile-friendly editing controls
- Export the active entry as PDF
- Offline-ready PWA support

## Tech Stack

- `index.html`
- `style.css`
- `app.js`
- Tailwind CSS via CDN
- Vanilla JavaScript
- `localStorage` for persistence
- Service worker + manifest for PWA support

## Project Structure

```text
Jesprit/
├── index.html
├── style.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── icon.png
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
└── README.md
```

## Running The App

### Basic local use

You can open `index.html` directly in the browser for the main journaling experience.

### PWA install and offline support

To use installable PWA behavior and service worker caching, serve the project through a local server instead of opening it with `file://`.

Examples:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How It Works

- Entries are stored locally in the browser using `localStorage`
- Theme and writing preferences are also saved locally
- The service worker caches the app shell for offline use
- PDF export uses the browser print flow for the active entry

## Privacy

Jesprit does not use accounts, servers, or remote databases. Your journal stays on the device and browser where you use it, unless you manually export it.

## Notes

- Clearing browser storage will remove saved entries
- PWA installation depends on browser support
- PDF export behavior can vary slightly by browser

## License

This project is currently for personal/project use unless you add a separate license.
