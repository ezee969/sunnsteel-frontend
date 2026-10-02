# UI Redesign v1.1 — "Ledger and Craft": coverage and evidence

Started 2026-10-02 on branch `claude/redesign`, from the integrated
`origin/main` at `3a57ac7` (DASH-06 shipped; UX-14 to UX-22, ACH-11 and
DASH-11 merged). The decisions live in
[ui-design-system.md §26](ui-design-system.md#26-amendment--v11-ledger-and-craft-2026-10-02)
and [ui-motion-spec.md §8](ui-motion-spec.md#8-amendment--v11-navigation-continuity-2026-10-02);
this file is the coverage matrix, the evidence, the skill log and what was not
verified.

**Scope, as the owner set it: presentation only.** Routes, destinations,
controls and their availability, task steps, defaults, disclosure rules, data,
calculations, validation, permissions, state lifecycles, persistence and copy
are unchanged. §5 is the diff audit.

## 1. Environment

| | |
| --- | --- |
| Frontend | worktree `.claude-worktrees/redesign-fe` on `claude/redesign`, `next dev --turbopack` on :3000 |
| Backend | `../sunnsteel-backend` at `origin/main` `b87fed3`, `npm run start:dev` on :4000, local PostgreSQL |
| Account | the owner's local test account (`@eze-prof`, rank Artisan) through the saved sign-in `.auth/state.json` |
| Data | read-only: no workout started or finished, no routine saved, no setting changed. The recap and finish-confirmation dialogs were rendered through a temporary, uncommitted route that fed the real components a finished session's real recap |
| Evidence | `../redesign-evidence/` beside the worktree, not committed: `baseline-3a57ac7/` (124 frames, before any change), `after-w2` … `after-w8`, `interact/`, the capture specs and scripts |

Viewports: 390×844 and 1440×900 for every route in both themes (baseline and
changed routes); 320 and 700/1024 where a change depends on them; the exact
boundaries 639/640, 767/768, 1023/1024 and 1279/1280 on the shell and three
changed pages.

## 2. Coverage matrix

`implemented—verified`: changed and checked in the browser at matched state
and size. `reviewed—retained`: reviewed against the captures and the three
skills, and kept, because it already serves the product. `unverified`: named
with the reason.

| Family | Route / surface | Source owner | Status | What changed, or why it is retained |
| --- | --- | --- | --- | --- |
| Shell | Protected layout, `<main>` | `app/[locale]/(protected)/layout.tsx` | implemented—verified | One gutter (16/24) aligned with the topbar; `shell-pin`/`shell-bleed` (§26.3) |
| Shell | Topbar | `features/shell/components/Header.tsx` | implemented—verified | Running head (§26.2); phone search proportion and ellipsis; decorative icons `aria-hidden` |
| Shell | Bottom bar | `BottomNav.tsx` | implemented—verified | One sliding marker; `touch-manipulation` |
| Shell | Sidebar, More drawer | `Sidebar.tsx` | reviewed—retained | Grouped index, sliding marker, focus trap and Escape already meet §11.10 and the skills; verified focus in/out |
| Shell | Active-session banner | protected layout | implemented—verified (code + render path) | Opaque ruled band, 44px Resume below `md`. Not seen live: it needs a session in progress |
| Shell | Global search results panel | `components/ui/search-bar.tsx` | reviewed—retained | Overlay per §11.9; spinner made `aria-hidden` |
| Shell | Page tabs | `components/layout/page-tabs.tsx` | implemented—verified | Sliding underline; pinned with `shell-pin` |
| Shared | HeroSection, CollapsibleSection, ShowMore, Explanation, GlossaryLine | `components/layout/` | reviewed—retained | Already the §20/§23 patterns; inscriptions now balance their lines and close their brackets after the last word |
| Shared | Dialog primitive | `components/ui/dialog.tsx` | implemented—verified | `overscroll-contain` |
| Home | Dashboard | `dashboard/page.tsx`, `DashboardRank.tsx` | implemented—verified | Masthead group; rank evidence in the sentence face; sentence-case caption. Sections, order, customise unchanged |
| Home | Today's Workouts, This Week, stat band, lists | `dashboard/components/*` | reviewed—retained | §25 already gave these their hierarchy |
| Training | Workouts (`/workouts`) | `workouts/page.tsx` | reviewed—retained | "No Active Workout" when nothing runs (it forwards into a live session otherwise); the bracket fix applies |
| Training | Schedule | `features/schedule/schedule-week-view.tsx` | implemented—verified | Entry rows (§26.8). Month view retained |
| Live workout | `/workouts/sessions/[id]` | `session-header.tsx`, `exercise-group.tsx`, `set-log-input.tsx`, page | implemented—verified on a finished session | Wrapping title, sentence captions, bounded set fields, capped column from `md`, rhythm, scroll margins clear of the pinned masthead and rest bar (WCAG 2.4.11) |
| Live workout | Rest timer bar | `rest-timer-bar.tsx` | reviewed—retained (unverified live) | Not shown on a finished session; not changed. Its persistence, BottomNav suppression and rest-over state untouched |
| Live workout | Finish / discard confirmation | `session-confirmation-dialog.tsx` | reviewed—retained, verified through the harness | States 1 of 12 and 11 remaining; actions per §11.9 |
| Live workout | Completion recap | `session-recap.tsx` | implemented—verified through the harness | Continue pinned in view; ruled figure lines on a phone; comparisons as two lines |
| History | `/workouts/history` | `workout-history-list.tsx`, page | implemented—verified | Phone rows: date-times on full lines; pinned header row on `shell-pin` |
| History | `/workouts/history/[id]` | page, `SessionRecapPanel` | implemented—verified | Inherits the recap layout; bracket fix |
| Routines | List | `routines/page.tsx`, `RoutineCard.tsx` | implemented—verified (pinned row only) | Cards retained; the grey Start is the correct disabled state, not a style defect |
| Routines | Discover | `RoutineDiscovery.tsx` | reviewed—retained | Two-column filters considered and declined (Spanish would truncate) |
| Routines | New, Edit (all four steps) | `routines/new`, `routines/edit/[id]`, `features/routines/wizard/*` | implemented—verified | Unboxed step body below `sm`; ruled stat band; pinned stepper and footer clear of the gutter |
| Routines | Detail | `routines/[id]/page.tsx` | implemented—verified | Phone gutter from 28 to 16; bracket fix. Planning group retained |
| Exercises | Catalog, detail | `features/exercises/*` | implemented—verified (pinned row) / reviewed—retained | Catalog search row on `shell-pin`; table and detail retained |
| Progress | Overview, Load, Workouts, Body | `features/progress/*` | reviewed—retained | Charts keep their data, scales and textual readings; none separates series by hue alone |
| Progress | Strength | `progress/strength/page.tsx` | implemented—verified | Best set and est. 1RM side by side; chart rises into the first phone screen |
| Recognition | Achievements | `achievements/page.tsx` | reviewed—retained | Crest, current/next, requirements already distinct |
| Identity | Own profile, `/members/[identifier]` | `features/profile/profile-view.tsx` | implemented—verified (Artisan) | Actions clear the Artisan/Maestro corner pieces; Maestro unverified (no account at that rank) |
| Community | Activity, Notifications, Search, relationship lists | `features/activity`, `features/notifications`, `search` | reviewed—retained | Ruled lists, honest empty states |
| Settings | All five tabs | `features/settings/*` | reviewed—retained | Panels per §11.5; pinned tabs now on `shell-pin` |
| Moderation | Queue | `features/moderation/*` | reviewed—retained | Decision controls already sentence-case outlines; seen as moderator only |
| Entry | Login, signup, forgot, reset, callback | `app/[locale]/(auth)/*` | reviewed—retained | Coherent with the system in both themes; bracket fix applies |
| Exceptional | Offline, not found, route error | `offline`, `not-found.tsx`, `error.tsx` | reviewed—retained | Not-found and offline captured; route error not provoked |
| Public | `/shared/routines/[token]`, `/shared/sessions/[token]` | `(public)/shared/*` | unverified | No share token on the test account; creating one would change data. They reuse the recap content and HeroSection, which were verified |

## 3. Waves

1. **Inventory and baseline.** 124 frames of 31 routes at 390 and 1440 in both
   themes, signed in and out, at `3a57ac7`: no horizontal overflow anywhere, no
   console error but the expected 404.
2. **Foundation and pilot** (`425dd10`): one gutter and the pin utilities, the
   running head, the bottom-bar and tab markers, the banner, the dashboard
   masthead, the live workout and the recap.
3. **Training and planning** (`6064de6`): the builder, schedule, strength and
   history rows.
4. **Evidence and identity** (`25a8faa`): the profile header's actions and
   corners. Other evidence and identity surfaces reviewed and retained.
5. **Supporting surfaces**: reviewed and retained (§2).
6. **Cross-app** (`f374fd8` and the closing commit): inscription brackets,
   balanced headings, three title lines on a phone, Spanish, preferences,
   boundaries, interactions, documentation.

## 4. The three references, per decision

| Decision | Frontend Design | UI/UX Pro Max | Web Interface Guidelines |
| --- | --- | --- | --- |
| Running head | Rejected the first, uppercase version as an eyebrow tell; one bold place (the inscription) | Clear page orientation | — |
| One gutter, pins | Alignment as structure | Sticky UI must not obscure content | — |
| Bottom-bar / tab markers | Motion only answering an action | Visible active state; spatial continuity | Transform only, interruptible, reduced motion |
| Set fields bounded | — | Editable vs read-only clarity; 44px targets kept | Tabular numerals |
| Scroll margins on the workout screen | — | Focus not obscured (WCAG 2.4.11) | Sticky headers must not cover focus |
| Sentence-case captions (workout, rank) | Removes tracked-capital chatter and monospace inside sentences | Readable labels | — |
| Recap footer pinned | — | Primary action reachable | `overscroll-behavior: contain` |
| Builder unboxed, ruled stat band | Boxes-in-boxes and identical stat tiles are template patterns | Dense form usability | — |
| Schedule, history rows | Structure is information | Long content handled without breaking layout | `min-w-0`, wrapping |
| Profile corner clearance | Ornament never at the cost of the action | Targets unobscured | — |
| Bracket after last word, balanced wraps | Type as an active design element | — | `text-wrap: balance` |
| Decorative icons hidden, `touch-manipulation` | — | — | Direct findings, fixed |
| Declined: two-column Discover filters | — | — | Spanish truncation |
| Declined: vibrant fitness palette | Brand-specific choice over defaults | Its product default for fitness | — |
| Declined: `...` → `…` in the search placeholder | — | — | Typography rule; a copy change is a product change here (§7) |

## 5. Diff audit

`git diff origin/main --name-only` against `lib/`, `hooks/`, `providers/`,
`middleware.ts`, `schema/`, `worker/`, `i18n/` and `messages/`: **no file**.
No query key, service, hook, form hook, validation schema, route, message or
contract changed. In the components, every `on*` handler, `href`, `key`,
`disabled` and render condition is unchanged; the lines a diff shows as
moved are re-indented inside new wrappers. The one new piece of state is the
tab underline's measured position, which affects only its own transform.

## 6. Not verified, and why

- **A live, in-progress workout**: rest bar, save-ring states, failed save,
  new-record feedback and the banner on other pages. Starting one changes the
  owner's data; the screen was verified on a finished session, which renders
  the same components.
- **Maestro, Virtuoso, Laureate profile headers**: the account is Artisan.
  The clearance for Maestro follows its generated piece sizes; it is unseen.
- **Shared routine and session pages**: no token without creating one.
- **Physical iPhone / installed PWA, virtual keyboard, safe areas**: phone
  emulation only.
- **200% zoom and text resizing**: not run as a separate pass.
- **Production origin**: local dev server only.
- **Portfolio frames** (`npm run ui:capture:portfolio`): not refreshed — it
  needs the reseed procedure, which mutates the database. No slug or route
  changed, so `e2e/portfolio-targets.ts` needed no edit.

## 7. Recorded, not changed (outside this scope)

- The search placeholder ends in `...` rather than `…` (`shell.search.placeholder`).
- The builder's day card title concatenates an English " Workout" onto the
  day name (`BuildDays.tsx`), so Spanish reads "Upper A - Horizontal Workout".
- `/routines/discover` sets its `h1` ("Discover Routines") at section rank
  with an icon rather than as the page inscription the other pages carry.
  Left as it is: promoting it changes the page's composition beyond the
  observed problems, and it reads correctly under the running head.
