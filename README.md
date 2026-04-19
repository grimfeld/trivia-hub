# Trivia Hub

Minimal trivia flash-card app built with **React + TypeScript + Tailwind CSS**.

## What it does

- Create cards that associate two things (country/capital, book/writer, etc.)
- Assign comma-separated tags
- Store cards locally in browser `localStorage` (no DB required)
- Filter library by tag
- Play/review mode by selected tag
- If no tag is selected in play mode, it reviews **all cards**

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel deployment

This repo is Vercel-ready:
- Uses Vite (`framework: vite`)
- Build command: `npm run build`
- Output directory: `dist`

You can import the repo into Vercel and deploy directly.
