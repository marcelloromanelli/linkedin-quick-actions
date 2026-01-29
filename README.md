# LinkedIn Quick Actions

A Chrome (MV3) extension that speeds up sourcing and profile review in LinkedIn Recruiter with keyboard shortcuts, configurable selectors, and an AI–assisted fit score overlay.

## Features
- Keyboard shortcuts on candidate slide‑in
  - `D` next, `A` previous, `S` save to pipeline, `W` hide
  - Shortcuts are ignored while typing; scoped to the slide‑in UI
- Popup (React + shadcn)
  - Toggle hotkeys, test selectors, choose a job profile, “Score Now”
  - Cmd/Ctrl+Shift+F also triggers scoring
- Options (React + shadcn)
  - Edit selectors (with Test buttons in Popup), toggle in‑page legend
  - AI settings: OpenAI API key (local only), model (select/refresh), auto‑scan toggle, impact profile
  - Job descriptions table (add/edit/delete). Last selection is remembered
- AI overlay (React)
  - 0–100 score, colored bar, strengths/weaknesses, dismiss button
  - Rainbow progress bar during scoring; hides on Next/Previous navigation
- Scope safe: runs only on `https://www.linkedin.com/talent/hire/*`

## Install (Load Unpacked)
1. Build the UI (first time only and whenever you change the UI):
   ```bash
   cd ui
   npm install
   npm run build
   ```
2. Open `chrome://extensions`, enable Developer mode, click “Load unpacked”, select the repo root (the folder with `manifest.json`).
3. You should see the extension icon. Click it to open the Popup. Open Options from the context menu or chrome://extensions.

## Configure AI
- Open Options → AI Settings
  - Paste your OpenAI API key (stored in `chrome.storage.local`, not synced)
  - Pick a model (default: `gpt-5-medium`), or click Refresh to fetch your available models
  - Toggle Auto‑scan to score automatically when a candidate slide‑in opens
  - Provide your Impact Profile text
  - Add Job Descriptions (name + text); select the relevant job in the Popup

## Use It
- Navigate candidates with `D`/`A`; save/hide with `S`/`W`
- In the Popup: Test selectors if a button is not found, then adjust in Options
- Trigger AI scoring via Popup “Score Now” or Cmd/Ctrl+Shift+F
- The overlay shows the score and can be dismissed; it hides automatically when you navigate

## Troubleshooting
- Options/Popup blank or 404: run `npm run build` inside `ui/` and click “Reload” in `chrome://extensions`
- “Could not establish connection”: open a Recruiter tab and try again; the Popup will auto‑inject the content script if missing
- Autoscan runs too often: turn it off in Options
- AI not configured: ensure API key is set and a Job Description exists/selected

## Development
- Tech stack: MV3 + React + Vite + Tailwind (v4) + shadcn/ui
- Important paths
  - `manifest.json` – MV3 config (content script + dist pages)
  - `src/content/content.js` – keyboard, selector tests, AI calls, overlay injector
  - `src/ai/prompt.txt` – system prompt for the LLM (easy to edit)
  - `ui/` – React sources for Popup/Options/Overlay
    - `ui/src/popup`, `ui/src/options`, `ui/src/overlay`
- Build UI while developing:
  ```bash
  cd ui
  npm run build -- --watch
  ```
  Then click “Reload” in `chrome://extensions` to see changes.

### Note about overlay bundle
The content script injects the built overlay CSS/JS from `dist/assets`. If you rebuild and asset filenames change (hashed), the extension code references may need to be updated. Look for the CSS and JS references in `ensureScoreOverlay()` inside `src/content/content.js` and update the filenames to match the latest build output shown by `npm run build`.

## Permissions
- `storage`, `tabs`, `scripting`
- Host permissions: `https://www.linkedin.com/talent/hire/*`, `https://api.openai.com/*`

## Privacy
- Your OpenAI API key and AI settings are stored locally (not synced). Selectors and simple toggles are stored in synced storage.

---
If you want, I can switch the overlay injector to a manifest‑driven loader (no hashed paths) to remove the manual filename update after UI builds.

