NUMBER ADVENTURE — iPAD INSTALLATION

This is a Progressive Web App (PWA). Once hosted on any HTTPS website, it can be installed on an iPad and will run full-screen like an app.

FASTEST TEST ON YOUR MAC
1. Open Terminal.
2. cd into this folder.
3. Run: python3 -m http.server 8080
4. On your Mac open http://localhost:8080 to test the game.

INSTALL ON IPAD
A PWA needs an HTTPS URL for offline/install behavior. The easiest options are GitHub Pages, Netlify, Cloudflare Pages, or any existing HTTPS web host.

After the folder is hosted:
1. Open the HTTPS game URL in Safari on the iPad.
2. Tap the Share button.
3. Choose “Add to Home Screen”.
4. Tap “Add”.
5. Launch “Number Adventure” from the iPad Home Screen.

The game caches its files after first launch, so it can work offline.

FILES
index.html              Main app UI
styles.css              Game graphics and layout
game.js                 Game logic
manifest.webmanifest    iPad/PWA metadata
sw.js                   Offline cache
icons/                   App icons

NOTE
This prototype recreates familiar block-number characters with local CSS artwork and contains no ads, analytics, tracking, purchases, or external links.
