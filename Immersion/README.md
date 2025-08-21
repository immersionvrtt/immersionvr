# IMMERSION VR — Full Project (with Dummy Data)

This package includes a full website with pages (Home, About, Services, Blog, Contact), a simple Admin dashboard, sample Firebase rules & functions, and **dummy data** to preview flows.

## Structure
- `web/` — Frontend site (static HTML/CSS/JS)
- `functions/` — Firebase Cloud Functions (email notifications, scheduled tasks)
- `firebase.json`, `.firebaserc` — Hosting config
- `firestore.rules`, `storage.rules` — Security rules
- `web/data/dummy.json` — Dummy users, bookings, blog posts

## Quick Preview (no Firebase)
Open `web/index.html` in your browser to see the site with dummy data (no login required). Admin & blog pages will simulate data from `web/data/dummy.json`.

## Connect to Firebase
1. Create a Firebase project.
2. Copy your Web App config into `web/js/firebase-config.js` (rename the example file).
3. Deploy Hosting + Functions:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   cd functions && npm install && cd ..
   firebase deploy --only firestore:rules,storage:rules,functions,hosting
   ```

## Notes
- Email verification + password reset are wired in the frontend (requires Firebase Auth to function).
- Admin dashboard enforces role logic client-side for demo; use security rules + Functions for real enforcement.
- Blog supports **scheduled publish** and **expiration**; Cloud Functions handle the automation when connected.

_Last updated: 2025-08-20_
