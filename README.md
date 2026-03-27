# Ewan MacKerracher — Portfolio (React + Vite + Firebase)

**Live site:** https://ewanhmack.github.io/Website-Project/

---

## Overview

Personal portfolio showcasing interactive software, UI tools, and game-related projects.
The focus is on **front-end engineering**, **tooling**, **UX/accessibility**, and **graphics-oriented development**, alongside experimental and personal projects.

This site acts as both a project showcase and a living sandbox for experimenting with ideas, packages, and interaction design. Content is fully dynamic — projects, photography, and music history are served from Firebase rather than static files, and can be updated without redeployment via a built-in admin dashboard.

---

## Highlighted Projects

- **Explain This UI**
  An interactive UI critique and annotation tool that allows users to upload screenshots, place draggable pins, and write structured feedback from different perspectives (UX, development, accessibility).
  Features include zooming, panning, colour-coded annotations, severity levels, and exportable critique data.

- **React Colour Picker Package**
  A reusable React colour picker component, inspired by existing solutions but rebuilt with a custom API and styling.
  Packaged and consumed as a dependency within other projects on this site.

- **NI Pathfinder**
  Interactive A* pathfinding visualiser built on Northern Ireland's real road network using OpenStreetMap data.
  Animates the search frontier in real time and draws the shortest path between two user-selected points.

- **Game & Graphics Projects**
  A collection of Unreal Engine 5, SFML/SEG, and experimental graphics projects exploring rendering, interaction, and engine-level systems.

---

## Site Features

- Dynamic content served from Firestore — no redeployment needed to update projects or photography
- Photography served from Firebase Storage with automatic portrait/landscape categorisation
- Spotify listening history synced every 5 minutes via a scheduled Cloud Function
- Protected admin dashboard for managing projects, photos, and monitoring system health
- Data-driven project tiles and case studies with dedicated detail pages
- Drag-and-drop photo uploads with client-side WebP conversion and EXIF extraction
- Live demos embedded directly into the site
- Responsive layout with accessible navigation
- Modular React structure for easy expansion

---

## Tech Stack

**Frontend**
- React, Vite, JavaScript / TypeScript
- CSS, Recharts

**Backend / Infrastructure**
- Firebase Firestore — projects, photography metadata, music history
- Firebase Storage — photos and project media
- Firebase Cloud Functions v2 — photo processing (exiftool), Spotify sync, health tracking
- Firebase Auth — admin authentication

**Tooling & Deployment**
- ESLint
- GitHub Actions — build and deploy to GitHub Pages
- Vite environment variables for Firebase config injection at build time

---

## Admin Dashboard

A protected `/admin` route provides:
- **Project management** — add, edit, and delete projects with a structured media and links editor, file upload, and clipboard paste support
- **Photo management** — drag-and-drop upload with WebP conversion, duplicate detection, and category tabs
- **System health** — Firestore document counts, time-series charts for music tracks and photo uploads, function run frequency, and live function status

---

## Local Development
```bash
npm install
npm run dev
```

Requires a `.env` file with Firebase config values:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Cloud Functions are located in `/functions` and require the Firebase CLI:
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```
