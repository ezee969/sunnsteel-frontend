# Final UI review

Visual confirmation: the screenshots are visible. The largest number visible is **150,076,699** (`kg lifted` in `dashboard-390-*`).

## P0 — Blocks visual sign-off

1. **The active-session captures still use the superseded colour semantics and cannot belong to the same finished system.** In every `session-full-*` capture, crimson is repeated across completed checkboxes and the filled **Finish Session** action, while gold is used for completion rules, labels and progress. The locked system reserves crimson for destructive actions and green for completion; finishing a workout is not destructive. Recolour completed sets and progress to the success treatment, make Finish Session the primary ink action, and recapture all six session pages plus the finish dialog before sign-off.

2. **Settings breaks at the exact 768 px target.** In `settings-768-light.png` and `settings-768-dark.png`, the shell leaves roughly 512 px for content but the page retains the desktop picture/form split and then divides the personal-information form into three columns. The result visibly truncates **Weight Unit** to `Ki` and the height value to `19:`. Collapse the outer split or make the fields one/two-column at this width; verify that every label, value and unit is fully visible at 768 px.

3. **Login is visually a separate product.** `login-*` replaces the stone/night ledger language with a glowing grid, vignette, split-screen quote panel and a small floating authentication form. At 390 and 768 px, a large empty vertical gap separates the wordmark from the form; at 1440 px, the quote occupies half the viewport while the actual task is underweighted. Remove the decorative SaaS split-screen/quote treatment and rebuild the page from the same ground, rules, typography, field boundaries and spacing rhythm as the protected product.

## P1 — Major consistency and responsive issues

4. **The active-session hierarchy repeats the same state too many times.** `session-full-*` shows **Complete 100%**, **Sets 15/15**, a separate **Progress 100%** panel and bar, a full-width Finish Session action, per-exercise **Complete** labels, and a completed control on every set. Remove the standalone progress/action card, retain one overall status in the masthead, and keep completion feedback local to each exercise/set. The current repetition turns a training screen into a wall of status chrome.

5. **The active session is compressed on mobile and merely stretched on desktop.** At 390 px, each set row packs three small numeric fields, micro-labels, units and a completion control into one line; at 1440 px the same row expands across a long horizontal span without gaining useful grouping or information. Use a deliberate compact mobile row with readable labels and bounded fields, then cap the desktop set editor width and group its inputs instead of distributing them across the page.

6. **History does not become a desktop layout at 1440 px.** In `history-1440-*`, the ledger remains approximately tablet-width in the centre of a very large canvas while date, duration and volume are still squeezed into that narrow strip. Let the ledger use the available desktop measure, expose the final columns at 1440 px, and align numeric columns on stable vertical axes. The current result looks like the 768 px composition centred on a wider screen.

7. **Profile retains a generic card-dashboard language that conflicts with the rest of the product.** `profile-*` combines a decorative gradient hero, an oversized circular portrait, three boxed statistic cards, colourful trend marks and a second boxed Personal Records panel. Replace the stat cards and records container with ruled ledger bands, remove non-semantic accent colours, and reduce the hero height—especially at 390 px, where decoration dominates the first viewport.

8. **The empty states are oversized generic placeholders rather than page-specific compositions.** `search-*` uses a large dashed rectangle with a centred icon and tiny copy; `workouts-*` leaves most of the page blank around another centred icon and button stack. At 768 and 1440 px both appear scaled up rather than redesigned. Remove the dashed card, keep the message on the page grid, and give each state a compact task-relevant next action with a deliberate maximum width.

9. **Dashboard desktop does not implement the specified open ledger.** In `dashboard-1440-*`, the six headline figures remain a 3-by-2 block instead of one six-column ruled band, and **Today's Workouts** is still a large boxed panel containing another prominent CTA. Convert the figures to the single desktop band, remove the nested-card effect, and let the workout row and action sit directly on the ledger grid.

10. **The routines controls fail at the mobile edge.** In `routines-390-*`, the horizontal filter strip visibly clips **Favorites** and hides the remaining options without any continuation affordance. The rounded floating **+ New** pill is also the only non-avatar pill in the product and sits over the routine ledger. Make the filter strip wrap or provide an explicit overflow control, and replace the floating pill with the same rectangular Create Routine action used at larger widths.

11. **The routine wizard spends too much of the mobile viewport on navigation before showing the task.** In `routines-new-390-*`, the masthead, active-routine notice and vertical four-step tracker push the first editable content well below the initial viewport. Condense completed/upcoming steps into a compact progress line on mobile and place the active notice adjacent to the relevant control, so the current step's form is visible without an initial scroll.

## P2 — Local polish and system drift

12. **Surface and radius rules are not applied consistently across page families.** The profile uses conventional bordered cards, Search uses a one-off dashed container, Login uses floating rounded form surfaces, Dashboard nests a CTA panel, and Routines introduces a fully rounded mobile action. Standardise these to the locked primitives: ruled rows for records/results, square wells for recessed content, 2 px controls/panels, and 4 px only for overlays.

13. **The finish confirmation uses destructive emphasis for a non-destructive commitment.** In `session-finish-dialog-*`, the filled crimson button is visually equivalent to the irreversible Delete action in `dialog-*`, even though one saves/completes work and the other destroys it. Use the primary ink treatment for Finish Session; reserve the crimson fill for Delete so colour continues to communicate consequence.

14. **The finish dialog has competing alignment axes.** Its title and progress details are left-aligned, while the central question and supporting copy read as centred blocks; the full-width mobile buttons introduce a third visual rhythm. Keep title, explanation, progress and warning on one left edge, then use the prescribed stacked mobile actions and compact desktop action row.

15. **Small condensed metadata loses readability in the densest screens.** Session field captions, routine metadata and several dark-theme secondary labels are materially smaller and tighter than the body copy around them; long pages repeat this weak text dozens of times. Raise repeated row metadata to the system's 13 px small-text role, remove tracked micro-uppercase where it is not a label, and keep condensed type for headings/data rather than explanatory copy.

16. **Several compositions rely on recognisable AI-template tropes instead of the product's own grammar.** The split authentication page with inspirational quote and glow, the profile gradient hero plus stat-card trio, the dashed centred empty state, and the floating pill action are four unrelated stock patterns. Replace each with the ledger rules, inscription hierarchy, bounded controls and semantic marks already defined by the locked system.
