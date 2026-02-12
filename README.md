# Pantom Studio Site

## Overview

This repository contains the Pantom Studio web app built with Next.js (App Router).

The site combines:

- a desktop-like folder navigation experience
- dynamic studio pages (`apps`, `labs`, `sites`, and more)
- configurable nav and folder content from local CMS JSON data

## Architecture

### App routes

- `app/page.tsx`: home desktop/folder entry experience
- `app/labs/*`, `app/apps/*`, `app/sites/*`, `app/principles/*`, etc.: feature and content routes
- `app/api/cms/public/route.ts`: public CMS payload endpoint
- `app/api/admin/login/route.ts`: admin auth endpoint

### Shared UI

- `components/studio/studio-frame.tsx`: global shell (header, nav, command palette)
- `components/studio/folder-icon.tsx`: folder visual system
- `components/studio/basic-page.tsx`: standard folder page scaffold
- `components/studio/under-construction-page.tsx`: WIP scaffold with tape asset and construction labels

### Data and config

- `lib/studio-data.ts`: nav and folder tile defaults
- `data/cms.json`: editable local CMS content

### Static assets

- `public/folders/*`: folder SVGs
- `public/assets/cellotape.svg`: tape asset used on under-construction pages

## Current WIP sections

The following routes are intentionally placeholder pages while content is being developed:

- `/branding`
- `/tools`
- `/start`

Each page currently shows:

- `WORK IN PROGRESS`
- `MEN AT WORK`
- `UNDER CONSTRUCTION`

## Getting started

Install dependencies and run development:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
