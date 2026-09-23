# PROF-11 closure — branded profile card

Closed 2026-09-23.

## Shipped behavior

- Every owner, authenticated-member and signed-out public profile offers
  **Share Profile Card**.
- The browser creates a 1200×1500 PNG from the identity, current Renaissance
  rank and ordered featured accomplishments already present in the
  privacy-filtered profile response.
- The card uses the Sunnsteel lockup, the active theme's semantic palette and
  the same crest geometry and rank pigment as ACH-09.
- File-capable Web Share opens the native share sheet. Other browsers download
  `sunnsteel-<username>-profile-card.png`.
- Nothing is uploaded or stored, and no contract or backend route changed.

## Verification

- `npm run verify`: 569 tests across 82 files and a clean production build,
  with the frontend and backend dev servers stopped before the build.
- Scoped UI checks: both `/profile` and `/members/:username` in light and dark
  at 320, 390, 430, 768, 1024, 1280 and 1440 px; PNG signature, 1200×1500
  dimensions, deterministic filename, download fallback and native file-share
  branch all passed.
- Authenticated local smoke: temporarily selected a real record, medal and
  Artisan rank, visually inspected the populated PNG, then restored the exact
  original empty selection. Empty cards were inspected in both themes too.
- Portfolio: the signed-out member-profile frame and manifest were refreshed.
- CI [35912479920](https://github.com/ezee969/sunnsteel-frontend/actions/runs/35912479920)
  and Vercel production completed successfully for frontend commit
  [`a390e22`](https://github.com/ezee969/sunnsteel-frontend/commit/a390e221c3315e74aff1120c58fd631299a2bf9a).
- Production: `/profile` opened authenticated, rendered the action, downloaded
  the PNG and emitted no console error.

## Not verified

- A physical iOS or Android share sheet; the file-share branch was exercised
  through the browser API with a compatible stub.
- A single rendered card containing all six slots at the maximum allowed text
  lengths. The model covers each item kind and the renderer truncates rows to
  the fixed image bounds.
