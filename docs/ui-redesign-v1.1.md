# UI Redesign v1.1 — "Ledger and Craft": coverage and evidence

Started 2026-10-02 on branch `claude/redesign`, from the integrated
`origin/main` at `3a57ac7` (DASH-06 shipped; UX-14 to UX-22, ACH-11 and
DASH-11 all merged). The design decisions live in
[ui-design-system.md §26](ui-design-system.md#26-amendment--v11-ledger-and-craft-2026-10-02)
and [ui-motion-spec.md §8](ui-motion-spec.md#8-amendment--v11-navigation-continuity-2026-10-02);
this file is the coverage matrix, the evidence and what was not verified.

**Scope, as the owner set it: presentation only.** Routes, destinations,
controls and their availability, task steps, defaults, disclosure rules, data,
calculations, validation, permissions, state lifecycles and persistence are
unchanged. No hook, service, query key, provider, middleware, schema, worker or
domain utility was edited (§5 lists the diff audit).

## 1. Environment

| | |
| --- | --- |
| Frontend | worktree `.claude-worktrees/redesign-fe`, `next dev --turbopack` on :3000 |
| Backend | `../sunnsteel-backend` at `origin/main` `b87fed3`, `npm run start:dev` on :4000, local PostgreSQL |
| Account | the owner's local test account (`@eze-prof`, Artisan), through the saved sign-in `.auth/state.json` |
| Data | read-only: no workout was started or finished, no routine saved, no setting changed |
| Evidence | `../redesign-evidence/` beside the worktree (not committed): `baseline-3a57ac7/` before, `after-*/` after, capture specs and the scripts that took them |

Viewports: 390×844 and 1440×900 for every route in both themes; 320, 768,
1024 and the exact boundaries 639/640, 767/768, 1023/1024, 1279/1280 on the
shell and changed pages.

## 2. Coverage matrix

Status: `reviewed—retained` (reviewed against the captures and kept as it
is), `implemented—verified`, `change justified` (open), `unverified`.

(Filled in per wave below.)

## 3. Waves

## 4. Motion inventory

## 5. Diff audit

## 6. Not verified, and why

## 7. Recorded, not changed (behaviour, out of scope)
