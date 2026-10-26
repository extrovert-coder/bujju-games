# Cookie Tycoon 3D

A cozy, browser based 3D bakery tycoon built with Vite, vanilla JavaScript modules, and Three.js. All models are procedural and the game saves in your browser with LocalStorage.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

Create a production build with `npm run build`; preview it with `npm run preview`.

## GitHub Pages

The GitHub repository is `bujju-games`. The Vite base path defaults to `/`; for GitHub Pages, build with `GITHUB_PAGES=true npm run build` (PowerShell: `$env:GITHUB_PAGES='true'; npm run build`) to use `/bujju-games/`. Publish the generated `dist/` folder with GitHub Pages, or configure Pages to build the repository using `npm ci && npm run build` and `GITHUB_PAGES=true`. To override the Pages path, set `GITHUB_PAGES_BASE` before building (PowerShell: `$env:GITHUB_PAGES_BASE='/your-repository/'; npm run build`).

## How to play

Start a new shop with $100. Each day, choose a batch size, cookie price, and advertising spend, then open for business. Click the oven, counter, mission board, upgrade menu, or Kevin to jump to the matching controls. Finish 30 days to see your results; after that, continue in free play. Progress autosaves after each meaningful action. Use the top-right controls to pause or change sound and camera settings.

## Controls

- Drag the bakery to orbit the camera; use the wheel or zoom buttons to zoom.
- Click bakery objects to open their controls.
- Use the planning panel and **Open for business** to run the day.
- Press Escape to pause. Save data stays on this device and browser.
