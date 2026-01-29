# Repository Guidelines

This project implements “LinkedIn Quick Actions” as a lightweight browser extension (or companion web app). Use the guidance below to keep contributions consistent and easy to review.

## Project Structure & Module Organization
- `src/`: Source code. Suggested subfolders: `content/` (content scripts), `background/` (service worker), `ui/` (popup/options), `lib/` (shared utils).
- `public/`: Static assets and `manifest.json` (for extension builds).
- `tests/`: Unit/integration tests mirroring `src/` layout.
- `scripts/`: Local tooling (build/release helpers).
- `dist/`: Build output (gitignored).

## Build, Test, and Development Commands
- `npm i` (or `pnpm i`): Install dependencies.
- `npm run dev`: Start local development build with watch/HMR where supported.
- `npm run build`: Production build to `dist/`.
- `npm test`: Run tests with coverage.
- `npm run lint` / `npm run format`: Lint and auto‑format the codebase.

## Coding Style & Naming Conventions
- **Language**: TypeScript preferred; ES modules; 2‑space indentation; semicolons on; single quotes.
- **Files**: `kebab-case.ts`; UI components `PascalCase.tsx` if React is used.
- **Identifiers**: `camelCase` for vars/functions, `PascalCase` for classes/enums, `UPPER_SNAKE_CASE` for constants.
- **Tools**: ESLint + Prettier. Fix issues before opening a PR.

## Testing Guidelines
- **Framework**: Vitest or Jest with Testing Library for DOM behavior.
- **Location**: `tests/**` or co‑located as `*.test.ts` next to code.
- **Coverage**: Target ≥ 80% lines/branches for changed areas.
- **Examples**: `npm test -- --watch` for TDD; mock network calls and isolate side effects.

## Commit & Pull Request Guidelines
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Keep changes scoped and descriptive.
- **PRs**: Include a clear summary, linked issue, and screenshots/GIFs for UI changes. Checklists:
  - Tests added/updated and passing
  - Lint/format clean (`npm run lint && npm run format`)
  - No secrets or personal data committed
  - Docs updated when behavior changes

## Security & Configuration Tips
- Store secrets in `.env.local` and never commit them. Reference via build‑time env where needed.
- For extensions, request minimal permissions in `manifest.json`; avoid content script overreach.
- Be careful when testing against real LinkedIn accounts—use test accounts where possible.

