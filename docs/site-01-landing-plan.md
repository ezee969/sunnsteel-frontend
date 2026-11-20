# SITE-01 — The public landing page: plan

Status: **plan, not started; the owner's scope decisions taken 2026-11-20**
(§11) (roadmap [`SITE-01`](roadmaps/product-roadmap.md#public-site)).
Written 2026-11-20 at the owner's request. It is the brief the build starts
from. The section-by-section specification (§12) is written next, with the
owner, one section at a time.

The owner's reference is Boostcamp's signed-out home page (hero with a
headline and two actions, a proof line, four verbs over phone frames, a
programme carousel, before-and-after photos). It is a reference for the
**kind of page** — a product presentation in front of the login — never for
its look, copy, colours, photography or claims.

---

## 1. What changes, in one paragraph

Today a signed-out visitor who opens `/` is redirected to `/login`
([middleware.ts](../middleware.ts), the `path === '/'` branch), so the first
thing anyone sees of Sunnsteel is a form. After `SITE-01`, `/` serves a
static, fast, bilingual presentation of the product to signed-out visitors,
with **Create a free account** as its one primary action and **Sign in**
beside it; a signed-in visitor still goes straight to `/dashboard`. Two
public pages sit beside it: `/features`, every capability in depth, and
`/pricing`, Free and Pro.
`/login`, `/signup`, every protected route, the public profile, share and
legal pages keep working exactly as they do.

## 2. Who it is for, and what it must make them believe

- **Visitor:** someone who lifts (or wants to) and arrived from a shared
  profile, a shared workout, a search or word of mouth, often on a phone,
  mostly in Spanish (Argentina is the paying market since `BILL-06`).
- **The one belief** (from [PRODUCT_VISION.md](../../PRODUCT_VISION.md),
  "Build yourself. Prove it through action."): *every set I log becomes
  evidence of who I am becoming — records, ranks and a history nobody can
  fake.*
- **The action:** create a free account. Secondary: sign in; install the app.
- **Mode** (impeccable's terms): *Persuade*. The app behind it stays
  *Operate*; the landing must not leak marketing tropes into the product.

## 3. What we take from the reference, and what we refuse

| Reference pattern | Sunnsteel's version | Why |
| --- | --- | --- |
| Hero: huge headline + two actions + app-store badges | Headline in the brand's Roman capitals, **Create a free account** (filled) and **Sign in** (ghost), and an **Install** line explaining the PWA | Sunnsteel is a PWA: store badges would be a false claim |
| "Loved by 1.5M lifters · 4.9 stars" | A proof line made **only of true facts** (see §6.2) or nothing | No invented numbers, ever |
| Track · Follow · Build · Measure over phones | Sunnsteel's own verbs — **Plan · Train · Measure · Earn** — over real screenshots in original device frames | Same rhythm, our product, our words |
| 14,000 programmes carousel | The three curated starter templates (`ROUT-03`) and the 8-week block (`ROUT-17`) | We sell depth, not volume |
| Before/after photo slider | **The rank ladder and crest family** (`ACH-09`/`ACH-11`) as the transformation story | Photos are deferred (`PROG-13`) and would need real consent |
| Yellow on black, condensed grotesk | The locked palette and type: ink, marble, honour gold only for "exceeded", Cinzel lockup | The design system is the brief |

## 4. Page structure (information architecture)

Each section names its content, its proof and its asset. Order is the
proposal; `impeccable shape` (§8, phase 1) may reorder it with the owner.

1. **Top bar** (§12.1) — lockup (`SunnsteelMark` + wordmark, §18), the
   Product menu and Pricing (`/pricing`), language switch (sets `ss-locale`, as Settings does),
   **Sign in** (ghost) and **Start free** (filled). Collapses to the lockup,
   Sign in and a menu below `md`.
2. **Hero** — headline, one-sentence subline, the two actions, the install
   line, and the hero visual (§7.2). Must make the offer intelligible in the
   first viewport at 390×844 without scrolling.
3. **Proof line** — true facts only (§6.2); placeholder figures during the
   build, never in production.
4. **The four verbs** — *Plan* (routine builder, templates, blocks), *Train*
   (live session: rest timer, plate calculator, set kinds, supersets),
   *Measure* (strength trends, muscle distribution, body progress, training
   signals), *Earn* (records, milestones, ranks). Each: a heading, two lines,
   an animated mock-up of the app's screen in an original phone frame (§7.3),
   and one detail callout.
5. **Tools for every workout** (§12.5) — a bento grid: automatic progression
   as the large card and three small ones (rest that starts itself and
   alerts, supersets and circuits, swapping an exercise), each with an
   animated mock-up. It replaced "the workout, in motion", which the hero's
   phone now shows (the owner's decision).
6. **Progress you can read** — the strength chart and the body map
   (`PROG-15`, shipped 2026-11-20), with real-looking synthetic data, labelled.
7. **Ranks** — the six crests from Initiate to Laureate drawn with the
   existing crest family, the rank decoration on a profile header (§24), and
   one line on what a rank means (attendance, not vanity).
8. **Start with a programme** — the three starter templates with their days
   and level; each links to `/signup?template=<slug>` (the template opens after
   sign-up, as `/routines/new?template=` does today; the exact hand-off is a
   build decision).
9. **Train with people** — follow, training partners, encouragement,
   messages; privacy first (every setting starts private).
10. **Free and Pro** — the Free/Pro split from `BILL-02` rendered from
    contracts (`PRO_PRICE`, `SUBSCRIPTION_TRIAL_DAYS`), never typed by hand;
    links to the legal pages and to `/pricing`. Founding members are not
    mentioned (the owner's decision: it no longer applies to a new account).
11. **Questions** — an accordion: is it free, do I need to install it, does it
    work offline, Spanish/English, what Pro adds, how to cancel (`/baja`),
    data export and deletion.
12. **Closing band** — the belief restated and the primary action once more.
13. **Footer** — `LegalLinks` (botón de arrepentimiento and botón de baja are
    legally required on every signed-out surface, `BILL-07`), terms, privacy,
    refunds, language, contact.

### 4.1 The public pages beside it

The owner's structure (2026-11-20), after Boostcamp's: the product shown **by
feature** and **by use case, divided by experience**. The top bar's Product
menu has a column for each, plus Plans, and Pricing sits beside it (§12.1).

- **`/features`** — every feature at a glance, each linking to its own page.
- **One page per feature**, `/features/<slug>` (slugs fixed in §12.1): the
  workout tracker (live session, rest timer, plates, warm-ups, set kinds,
  supersets), the routine builder (templates, rotations, versions), automatic
  progression (double progression, the 8-week block), progress (strength,
  the body map, body progress, training signals), ranks and achievements, and
  training with people (follows, partners, messages, privacy).
- **Use cases by experience**, `/use-cases/<level>` (slugs fixed in §12.1), each
  with its starter template, the features that matter at that level and the
  plan that fits:
  - **Beginners** — Full Body Foundations, the onboarding's recommendation,
    warm-ups, the plate calculator, the rest timer.
  - **Intermediates** — Upper / Lower, Push / Pull / Legs, double
    progression, the 8-week block, plateau watch.
  - **Advanced lifters** — training blocks, deloads, training signals and
    block comparison, the training review (Pro).
  No use cases by goal (powerlifting, hypertrophy): Sunnsteel has no
  goal-specific programmes, so such a page would promise what is not there.
- **`/pricing`** — Free and Pro from contracts, the comparison rows `/plans`
  already renders ([plans.ts](../lib/utils/plans.ts)), the trial and the
  payment questions. What a signed-in visitor sees there is decided in §12.
- All of them share the landing's layout, top bar and footer, and every rule
  in §5–§7.

## 5. Architecture and routing

- **Route:** a new route group `app/[locale]/(site)/` with its own lean layout
  (no protected shell, no notification or realtime providers), holding the
  landing and `/features` and `/pricing`, which are in neither
  `PROTECTED_PREFIXES` nor `AUTH_PAGES`. The page is a
  **Server Component, fully static per language** — no TanStack Query, no
  Supabase read on render. Interactive islands (the hero video, the menu, the
  accordion, the language switch) are small client components.
- **Middleware:** the `/` branch changes from "redirect to `/login` when
  signed out" to "rewrite to the landing when signed out"; signed in still
  redirects to `/dashboard`. `middleware.test.ts` gains both cases.
- **Language:** the address carries no locale (I18N-01), so crawlers see the
  language chosen by `Accept-Language`. A crawler without one gets
  **English**, the app's default (the owner's decision). Copy lives
  in a new `site` message area in both languages, written together.
- **SEO:** per-language `generateMetadata` (title, description, OG image per
  language from the existing generator), canonical URL, `robots.txt` and
  `sitemap.xml` (neither exists today), and `SoftwareApplication` JSON-LD with
  the real price and currency from contracts. No `hreflang` alternates while
  the language is not in the address — recorded as a known limit.
- **PWA:** the landing is not precached and never shown inside the installed
  app (an installed app opens at `start_url`, which stays the app). The service
  worker's network-first page policy is unchanged; confirm `/` offline shows
  `/offline`, not a stale landing.
- **Observability and analytics:** Sentry already covers the page. Conversion
  (landing → signup → first workout) is measured with **Vercel Web Analytics**
  (the owner's decision: cookieless, no consent banner) on the public pages;
  whether signup and the first workout can be custom events depends on the
  Vercel plan, checked at build.
- **Performance budget** (mid-range Android, 4G, cold): LCP ≤ 2.0 s, CLS ≤
  0.05, INP ≤ 200 ms, landing JS ≤ 90 KB gzip beyond the framework, hero image
  ≤ 150 KB AVIF with WebP fallback, fonts already self-hosted and preloaded.
  **The hero video never delays LCP**: its still poster is the LCP element;
  the muted, looping clip (≤ 1.5 MB on phones -- the reference ships about
  0.6 MB, §13.4, which is the target -- ≤ 4 MB on desktop, no audio
  track) starts after first paint; under either reduced-motion source or
  `Save-Data` the poster stays. Lighthouse ≥ 95 in all four categories on
  phone and desktop.

## 6. Content rules

### 6.1 Voice
The app's voice (design system §23.4, [i18n.md](reference/i18n.md)): plain,
exact, no hype words, sentence case except region labels; Spanish neutral
Latin American with *tú* and the glossary's words. Headlines may be shorter
and bolder than app copy, never less true.

### 6.2 Honesty (non-negotiable)
- **No invented number, rating, testimonial, logo wall or user count on the
  live site.** Placeholder figures are used for now (the owner's decision):
  during the comps and the build, the proof line and any counter show mock-up
  numbers, held in one module and marked as placeholders. **They never reach
  production**: a production build renders each placeholder as a reserve true
  fact instead (§12.3), so nothing invented ships and no deploy of the app is
  ever blocked by the site; before launch each becomes a real number read
  from production (above a threshold the owner sets) or stays replaced --
  decided then.
- Allowed true facts today: free to start; works in the browser and installs
  on any phone; works offline with changes saved on reconnect; English and
  Spanish; your data exportable and deletable; private by default.
- Every screenshot or mock-up with data is **synthetic and labelled** as an
  example. No real member's name, face, record or message appears.
- Generated people are allowed (the owner's decision), the hero video's
  included: clearly illustrative, never presented as members, their results
  or testimonials.

## 7. Visual design

### 7.1 The system decides
The page is designed under [ui-design-system.md](ui-design-system.md) and
[ui-motion-spec.md](ui-motion-spec.md), through the project skill
[`sunnsteel-design`](../.claude/skills/sunnsteel-design/SKILL.md): general
skills advise, the documented rules decide. A landing needs things the app
never did, so the build starts with **design-system amendment §33 "The public
site"**, approved by the owner with the chosen comp, covering:

- **Display type above `type-display`:** one or two marketing ranks for the
  hero and section openers (Cinzel capitals, the lockup's face), with fluid
  sizing (`clamp`) and Spanish's 20–30 % extra length measured at 320 and 390.
- **Imagery:** where full-bleed images, the marble/stone ground and steel
  material from the 2026-10-01 brand explorations may appear, and how text
  sits over them at AA contrast in both themes.
- **Colour:** roles unchanged — ink fills the primary action, honour gold
  stays "exceeded expectation" (a record in the live-session sequence, a reached rank), never
  decoration. Richness comes from material and imagery, not new hues.
- **Motion** (the third motion amendment), **cinematic by the owner's
  decision**: the page is to be far more animated than the app, in the way
  Boostcamp's signed-out home is. Within `(site)` only, §9.2's ban on page
  entrances and per-section fade-ups is lifted: scroll-driven section
  entrances, parallax on imagery, the hero video, scroll-linked phone
  sequences, and the product's own signatures (rule draw, set completion,
  crest draw §24.4, rest bar). **Each section's motion is declared in §12
  when that section is specified**, desktop first -- the browser version is
  the richest; phones get a lighter cut of the same motion. Transform and
  opacity only, CSS scroll-driven animations or the installed `framer-motion`
  (a new library only if §33 records why), never on the app's own pages, and
  all of it off under both reduced-motion sources, where every section is
  simply present.
- **Device frames:** original, drawn as SVG to the brand's line language — not
  Apple's or Google's frames.

### 7.2 Hero visual — a background video of people training
The owner's decision, after Boostcamp's signed-out hero: **AI-generated,
muted, looping clips of illustrative athletes training**, graded to the
brand's stone and steel, under the headline and actions, at AA contrast in
both themes through a toned overlay. The comp round (§8, phase 2) compares
treatments of it, the choice delegated to Claude:

1. full-bleed video with the headline over it;
2. the video beside the live-session phone, which overlaps it;
3. the video inside a stone or arch frame.

The 2026-10-01 material (the `final-4a` "presencia" bust, the monument under
construction) may serve other sections, such as Ranks. **Gate:** a clip whose
people look uncanny is rejected at the comp review; the fallback, licensed
stock footage, is put to the owner then.

### 7.3 Phone mock-ups — the app's screens, animated

The owner's decision (2026-11-20), after Boostcamp (§13.4): the phones on
the public pages show **the app's own interface as animated HTML**, not
still screenshots, playing by themselves -- a set ticked, plates sliding onto
the bar, the rest bar counting, a record crossing in gold, a crest drawing, a
floating card rising under the phone. Never interactive.

- **Built from the app, not imitated.** Each mock-up renders the real
  presentational components with the real tokens and type ranks, fed
  synthetic data in the visitor's language; where a component is tied to a
  data hook, it is split into a presentational part the app and the site both
  use. A mock-up never fetches, never signs in and never reaches the API.
  That is what keeps them current as the app changes.
- **A mock-up is a script**: a list of states with their timings, declared
  per section in §12 (desktop and phone), using the motion tokens and the
  product's own signatures (set completion, rule draw, crest draw §24.4).
- **When it plays:** from when at least half of it is in view; paused off
  screen and in a hidden tab; one loop running per viewport. Under either
  reduced-motion source, and before JavaScript runs, it shows its final state
  as a still.
- **Accessibility:** the mock-up is `aria-hidden` and never focusable; the
  section's own text says what it shows, so nothing depends on watching it.
- **Weight:** CSS keyframes and transitions first, `framer-motion` only for
  sequences CSS cannot express; each mock-up's client code counts against
  §5's landing JS budget, and the mock-ups load as islands, never in the
  first viewport's critical path.
- **Labelled:** each carries the "example" mark of §6.2.
- Still screenshots from the portfolio pipeline (§8, phase 3) remain for the
  OG images, feature-page figures where nothing moves, and the reduced-motion
  fallback where a component cannot render a final state.

## 8. Skills, tools and agents — the production workflow

Each phase ends in an owner approval before the next starts.

### Phase 0 — Brief and context
- **`impeccable init`** — writes `PRODUCT.md` and the landing's surface brief
  (mode *Persuade*) from this plan, [PRODUCT_VISION.md](../../PRODUCT_VISION.md)
  and [FEATURES.md](../../FEATURES.md). It must **point to
  `ui-design-system.md` as the visual authority** rather than generate a
  competing `DESIGN.md` (the `sunnsteel-design` rule); any `DESIGN.md`
  impeccable needs is a pointer file.
- The owner's decisions are recorded in §11; anything new that comes up at
  claim is asked with **`AskUserQuestion`**.

### Phase 1 — Shape (structure and copy, no visuals)
- **`impeccable shape landing`** — the section order, each section's job, the
  proof each one uses, the states (narrow, wide, Spanish, reduced motion).
- **`impeccable clarify`** — headline, subline and every section's copy, in
  English and Spanish together; checked against the glossary.
- Deliverable: a copy deck in both languages, approved by the owner.

### Phase 2 — Direction and comps (the UI decision)
- **`impeccable` new-work flow** (`concept-seed --scope direction --mode
  persuade`) over the three hero treatments in §7.2, constrained by the design
  system. The chosen direction is recorded as a **direction contract** in the
  surface brief, never in shipped code.
- **Comps** (impeccable's `visualize` round): three full-page compositions at
  1440 and 390, in both themes, under `.impeccable/mocks/`. Image generation,
  in order of preference:
  1. the image generation `impeccable context` reports (harness-native or its
     API fallback);
  2. **Figma MCP** — `create_new_file` + `create_session`, then
     `generate_image` for raster scenes, `generate_vector_illustration` for
     ornament and frames, and `use_figma` to lay the comps out as editable
     frames the owner can comment on (`get_screenshot` to review);
  3. **Canva MCP** `generate-image` as a fallback for scene variants.
- **Hero video**: the Canva MCP's `create-video` (with
  `get-video-production-guide`) or the Figma MCP's generative models
  (`weave_find_model`/`weave_run_model`), whichever gives the best clip; each
  candidate is reviewed as a still and in motion at 390 and 1440.
- **`frontend-design`** and **`web-design-guidelines`** as critique of each
  comp, sorted through `sunnsteel-design` (fix / fits / contradicts / declined).
- Deliverable: one approved comp per breakpoint + amendment §33 drafted.

### Phase 3 — Assets
- **`impeccable-asset-producer` agent** — turns the approved comp's raster
  regions into clean plates (no baked text, transparent where isolated) at
  asset resolution.
- **`scripts/generate-landing-assets.mjs`** (new, `sharp`, like
  `generate-brand-icons.mjs`) — every plate to AVIF + WebP at 640/1080/1600/
  2400 widths with fixed aspect ratios (no CLS), plus the per-language OG
  images, and the hero video as MP4 (H.264) and WebM at phone and desktop
  sizes with its poster (`ffmpeg`, its availability checked at build).
- **Real product screenshots** — extend
  [e2e/portfolio-targets.ts](../e2e/portfolio-targets.ts) with `site-*` slugs
  captured by `npm run ui:capture:portfolio` at 390×844 (phone frames) and
  1440×900, both languages and themes, from a **seeded demo account** with
  synthetic data (never the owner's). Re-running it keeps the landing's
  screenshots current as the app changes.
- **Crests and ornament** — reuse `RankCrest` and the generated rank
  decoration; no new drawing for them.
- **`anthropic-skills:canvas-design`** — only if a poster-like still is needed
  (for example the social card), from the approved direction.

### Phase 4 — Build
- **`vercel:nextjs`** and **`vercel-react-best-practices`** — static Server
  Components, metadata, image handling, keeping client islands small.
- **`impeccable` comp-led build** (`build-phase`: spec → plates → hero →
  sections → responsive) so the page matches the approved comp by measurement,
  not by eye.
- **`impeccable animate`** — implements each section's motion as §12 declares
  it, with CSS and the already-installed `framer-motion` (no new animation
  library unless §33 records why).

### Phase 5 — Review and harden
- **`impeccable critique`**, **`impeccable audit`** (a11y, performance,
  responsive), **`impeccable harden`** (Spanish lengths, missing images, no-JS
  rendering, slow network), **`impeccable polish`**.
- **`impeccable-finish-reviewer` agent** — the build against the direction
  contract and the comp.
- **`vercel:performance-optimizer` agent** — Core Web Vitals against §5's
  budget.
- **`web-design-guidelines`** — a final pass.
- **`impeccable-documenter` agent** — drafts amendment §33's final text from
  the built page; it lands in `ui-design-system.md`, not a separate DESIGN.md.

### Phase 6 — Verify and ship
- Unit tests: the middleware's `/` cases, the plan rows rendered from
  contracts, every message key in both languages, JSON-LD values from
  contracts.
- **Regression sweep:** add `site` to [e2e/regression.spec.ts](../e2e/regression.spec.ts)
  (7 widths × 2 themes) and run it in English and Spanish (`UI_LOCALE=es`).
- **Browser pass** (built-in browser or Playwright): signed-out `/` shows the
  landing, signed-in `/` goes to the dashboard, every action lands where it
  says, the language switch, reduced motion and higher contrast, keyboard
  path through the page.
- Lighthouse on phone and desktop against §5; screenshots of the result for
  the owner; portfolio entry for `site`.
- Ship through CI to Vercel and confirm the alias serves it (the alias, not a
  READY state, proves what is live).

## 9. Acceptance criteria

1. A signed-out visit to `/` in production shows the landing in the visitor's
   language; a signed-in one opens the dashboard; `/features` and `/pricing`
   open for anyone; no other route changed.
2. The first viewport at 390×844 states the offer and shows both actions.
3. Every claim on the page is true on launch day; no placeholder figure is in
   the production build; every data image is labelled synthetic; prices come
   from contracts.
4. Both languages, both themes, all seven sweep widths pass; no text truncated
   in Spanish.
5. §5's performance budget and Lighthouse ≥ 95 are met and recorded.
6. Amendment §33 is in the design system, approved, and the page follows it.
7. Legal buttons and pages are reachable from the footer.

## 10. Risks

- **Marketing drift into the app** — mitigated by the route group's own layout
  and §33 applying only to `(site)`.
- **Generated imagery or video that looks generic or uncanny** — the comp
  round and the owner's approval gate it; licensed stock footage is the
  hero's fallback.
- **Placeholder figures shipped by mistake** — a production build swaps each
  for a reserve true fact, and a test holds it (§6.2, §12.3).
- **Mock-ups drifting from the app** — mitigated by rendering the app's own
  presentational components (§7.3), so a changed screen changes its mock-up;
  a mock-up that cannot is listed in §12 and checked at each release.
- **Stale screenshots** — mitigated by capturing them from the portfolio
  pipeline, re-run when a pictured screen changes.
- **SEO limits of a locale-less address** — accepted for now; a `/es`,
  `/en` public prefix is a separate decision if search traffic matters.
- **Weight** — imagery, video and motion must fit §5; anything that does not is cut,
  not compressed until it looks bad.

## 11. The owner's decisions (2026-11-20)

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Scope | The landing at `/` plus public `/features` and `/pricing` (§4.1) |
| 2 | Motion | Cinematic, on the public pages only, declared section by section with the richest version on desktop (§7.1) |
| 3 | Phones | Animated HTML mock-ups of the app's screens, playing by themselves as Boostcamp's do; no interactive demo (§7.3; replaced "screenshots only" the same day) |
| 4 | Human figures | Illustrative generated people allowed (§6.2) |
| 5 | Hero | A background video of people training; the treatment for the comps chosen by Claude (§7.2) |
| 6 | Video source | AI-generated, with licensed stock as the fallback if it looks uncanny |
| 7 | Video on phones | Yes, a light version after first paint (§5) |
| 8 | Addresses | `/features` and `/pricing`, in English like the app's routes |
| 9 | Crawler language | English |
| 10 | Analytics | Vercel Web Analytics |
| 11 | Counters | Placeholder figures for now; none in production (§6.2) |
| 12 | Founding members | Not mentioned |
| 13 | Features | One page per feature under `/features`, plus the overview (§4.1) |
| 14 | Use cases | Three pages by experience: beginners, intermediates, advanced lifters (§4.1) |
| 15 | Use cases by goal | Not now |
| 16 | Reference review | Boostcamp's whole site reviewed before §12 is written (§13) |
| 17 | Top bar | A Product menu with Features, Use cases and Plans columns, plus Pricing; transparent over the hero, solid after it (§12.1) |
| 18 | Hero layout | Text with the animated live-session phone on desktop, text alone on phones (§12.2) |
| 19 | Headline | "Forge yourself. Prove it in every set." / "Fórjate. Demuéstralo en cada serie." |
| 20 | Proof band | Two usage placeholders and two true facts, counting up, on the hero's dark ground; production swaps placeholders for reserve true facts (§12.3) |
| 21 | Four verbs | A fixed stage on desktop, one phone pinned while the verbs scroll; "Planifica · Entrena · Mide · Gana"; Train shows plates and warm-ups (§12.4) |
| 22 | Section 5 | A tools bento in place of "the workout, in motion": automatic progression large; rest, supersets and swapping small (§12.5) |

Taken by default, not asked: the headline and positioning line (phase 1
proposes three); the body map on Progress, since `PROG-15` shipped the same
day.

## 12. Section-by-section specification

Written with the owner, one section at a time, before the build. Every
section states the same things, in this order: **job**, **content and copy**
(English and Spanish, message keys under `site.<section>`), **layout** (390,
768 and 1440), **motion** (desktop, phone, reduced motion and no
JavaScript), **assets**, **data**, **accessibility** and **acceptance
checks**. Copy marked *draft* is settled in the phase 1 copy deck; everything
else in an approved section is decided.

Items a section needs from design-system amendment §33 are listed at its end
and collected in §12.9 when §33 is drafted.

### 12.1 Top bar — `SiteTopBar`

*Approved 2026-11-20: Product menu plus Pricing; transparent over the hero,
solid after it.*

**Job.** The brand, the way into every public page, and both actions at every
scroll position.

**Content and copy** (`site.topBar`):

| Item | English | Spanish | Goes to |
| --- | --- | --- | --- |
| Lockup | `SunnsteelLockup` (§18), accessible name "Sunnsteel, home" | "Sunnsteel, inicio" | `/` |
| Menu trigger | Product | Producto | opens the panel |
| Link | Pricing | Precios | `/pricing` |
| Language | EN · ES, the current one marked by an underline and `aria-current`, never by colour alone; names read "English" and "Español" | same | sets `ss-locale` through [locale-cookie.ts](../i18n/locale-cookie.ts) and reloads on the same page (each language is its own static build) |
| Ghost action | Sign in | Iniciar sesión | `/login` |
| Filled action | Start free | Empezar gratis | `/signup` |

A signed-in visitor needs no detection on these static pages: the middleware
already sends a signed-in `/login` or `/signup` to `/dashboard`, so both
actions take them into the app.

The **Product panel** has three columns, each headed by a region label:

| Column | English | Spanish | Address |
| --- | --- | --- | --- |
| FEATURES / FUNCIONES | All features | Todas las funciones | `/features` |
| | Workout tracker | Registro de entrenamiento | `/features/workout-tracker` |
| | Routine builder | Constructor de rutinas | `/features/routine-builder` |
| | Automatic progression | Progresión automática | `/features/progression` |
| | Progress | Progreso | `/features/progress` |
| | Ranks and achievements | Rangos y logros | `/features/ranks` |
| | Training with people | Entrenar con gente | `/features/community` |
| USE CASES / CASOS DE USO | Beginners | Principiantes | `/use-cases/beginners` |
| | Intermediates | Intermedios | `/use-cases/intermediates` |
| | Advanced lifters | Avanzados | `/use-cases/advanced` |
| PLANS / PLANES | Pricing | Precios | `/pricing` |
| | Is it free? | ¿Es gratis? | `/pricing#free` |
| | Pro | Pro | `/pricing#pro` |
| | Install the app | Instalar la app | `/#install`, the landing's question on installing (no page of its own) |

These addresses fix the slugs §4.1 left open.

**Layout.**
- **≥ 1024:** a 64px bar, content up to 1280px with 32px gutters: lockup
  left; Product and Pricing after it; the language switch, Sign in and Start
  free right. The panel opens under its trigger, up to 720px wide, three
  columns divided by `--rule-faint`, on `--popover` with `shadow-overlay`
  (the one shadow, reserved for overlays) and the small radius.
- **768–1023:** the same bar without the language switch, which moves to the
  foot of the panel.
- **< 768:** a 56px bar with 16px gutters: the lockup (the mark alone below
  360px), Start free at the `sm` size (44px) and a menu button (44px, "Open
  menu" / "Abrir menú"). The menu is the existing drawer primitive, full
  height: the three columns as accordion groups, Pricing, the language switch
  and Sign in as a full-width outline. Start free stays the bar's one filled
  control.
- **Over the hero** the bar has no ground and renders with the Night tokens in
  both themes (a `.dark` scope), because the video beneath is dark either
  way. **Once the hero's lower edge passes under it** (an
  IntersectionObserver on a sentinel there), it takes the page's own ground
  and theme and its bottom rule draws in. It stays sticky; it never hides on
  scroll, so Start free is always one tap away.

**Motion.**
- *Desktop and phone:* the bar is present at first paint, never animated in
  -- chrome does not perform. Becoming solid: the ground fades in over
  `--motion-base` and the bottom rule draws from the left over 240ms (the rule
  draw, §9.1); going back over the hero reverses it at exit timing. The panel
  enters over 200ms (opacity and a 4px drop), its columns 40ms apart, and
  leaves over 140ms; the trigger's chevron turns over 200ms. Hover changes
  colour only (§9.2).
- *Phone menu:* the drawer's own 300ms enter and 200ms exit with its scrim;
  accordion groups reveal by opacity.
- *Reduced motion:* every change is instant or opacity-only at
  `--motion-fast`; no draw, no stagger.
- *No JavaScript:* the bar renders solid; the Product trigger is a link to
  `/features`, and the phone menu button to the footer's links.

**Assets.** None beyond the lockup.

**Data.** None; static.

**Accessibility.** `<header>` holding `<nav aria-label>` ("Main" /
"Principal"); a "Skip to content" / "Saltar al contenido" link first in the
tab order; the panel built on Radix NavigationMenu (shadcn's
`navigation-menu`, added and styled to the system), which gives
`aria-expanded`, arrow-key movement, Escape and focus return; hover opens it
only for a fine pointer, after a short intent delay; every target at least
44px on touch.

**Acceptance checks.** At 320 in Spanish the bar holds the mark, Empezar
gratis and the menu button without overflow; the panel is usable by keyboard
alone; the language switch reloads into the other language on the same page;
the bar turns solid exactly when the hero leaves; a signed-in visitor's Sign
in opens the dashboard.

**Needs from §33.** The Night scope for regions laid over imagery in the
light theme; the transparent-to-solid bar.

### 12.2 Hero — `SiteHero`

*Approved 2026-11-20: text with the animated live-session phone on desktop,
text alone on phones; the headline. The other copy is draft.*

**Job.** In the first viewport at 390×844, in either language, state the
offer and show both actions; at 1440, also show the product working.

**Content and copy** (`site.hero`):

| Part | English | Spanish |
| --- | --- | --- |
| Eyebrow (label rank) | FREE TO START · NO APP STORE NEEDED | GRATIS PARA EMPEZAR · SIN TIENDA DE APPS |
| Headline (`h1`) | Forge yourself. Prove it in **every set**. | Fórjate. Demuéstralo en **cada serie**. |
| Subline *(draft)* | Plan your training, log every set and watch your records and your rank build up, in a history nobody can fake. | Planifica tu entrenamiento, registra cada serie y mira crecer tus récords y tu rango, en un historial que nadie puede inventar. |
| Filled action | Create a free account → `/signup` | Crear cuenta gratis → `/signup` |
| Ghost action | Sign in → `/login` | Iniciar sesión → `/login` |
| Install line *(draft)* | Works in your browser and installs on any phone, with no app store. **How to install** → `/#install` | Funciona en el navegador y se instala en cualquier teléfono, sin tienda. **Cómo instalarla** → `/#install` |
| Video control | "Pause background video" / "Play background video" | "Pausar el video de fondo" / "Reproducir el video de fondo" |
| Mock-up mark | Example | Ejemplo |

The headline is written in sentence case in the messages and set in Cinzel
capitals by its rank. The bold words are a `<mark>` rich-text tag
(`t.rich`), which carries **the brand's rule drawn under them** -- not gold:
honour stays "better than planned" (§4.3), and gold under a headline would be
decoration. The phone's record (below) is the viewport's one honour mark.

**Layout.**
- **≥ 1024:** height `min(100svh, 900px)`, at least 640px. Content up to
  1280px on a 12-column grid: the text in columns 1–7, left-aligned and
  vertically centred; the phone mock-up (a 320px original SVG frame, §7.1) in
  columns 9–12, standing on the hero's lower edge and overlapping the proof
  band (§12.3) by 48px, so the next section starts under it.
- **768–1023:** the text alone, left-aligned; the phone appears from 1024.
- **< 768:** the text alone, centred; the hero is as tall as its content
  (about 96px above it, 48px below) so the proof band starts inside the first
  viewport and says there is more. The two actions sit side by side only
  where both fit (Spanish needs about 400px); otherwise they stack full width,
  filled first. Measured estimate at 390×844 in Spanish with stacked actions:
  about 530px of the 844, the bar included.
- **Type** (from §33): the headline in a display rank of Cinzel 600 capitals,
  `clamp(30px, 8vw, 88px)`, line-height about 1.02, `text-wrap: balance`,
  wrapping naturally ("DEMUÉSTRALO EN" is too wide for one line at 320);
  the subline in a lead rank of Source Sans 3 at 18–20px, at most 52
  characters a line, in Night `--ink-2`; the eyebrow is the label rank; the
  install line body small.
- **The video** fills the hero (`object-fit: cover`) under a flat Night scrim;
  on desktop a second flat layer sits under the text column only. Each cut is
  framed so its subject is clear of the text: the right two thirds on
  desktop, the upper half on phones. Text contrast is measured against the
  brightest frame of each cut and must reach 4.5:1.

**Motion.**
- *Desktop, on load* (t = first paint; the poster is already there, and it is
  the LCP element):
  1. 80ms: the eyebrow rises 12px and fades in over 700ms.
  2. 160, 250 and 340ms: the headline's three lines rise from behind a mask
     (each line clipped, translated from 100% to 0) over 900ms.
  3. About 1.2s: the rule draws under "every set" / "cada serie" from the left
     over 480ms (the rule draw at display scale; §33 records the longer
     duration).
  4. 600ms: the subline rises 12px and fades in over 700ms; 720ms: the
     actions, 8px over 600ms; 840ms: the install line fades in over 500ms.
  5. 700ms: the phone rises 40px and fades in over 1000ms; once settled its
     script runs (§7.3): set 3 is ticked (the set-completion signature), the
     rest bar appears and counts down, then a card rises under the phone --
     "New record · Squat 85 kg × 5" / "Nuevo récord · Sentadilla 85 kg × 5"
     -- with its honour mark, and the phone rests on that state.
     **The script lasts at most 5 seconds** and plays again each time the
     phone re-enters the view (WCAG 2.2.2 then needs no control for it).
  6. When the video can play (it is requested after the page's `load`
     event, when the browser is idle), it crossfades in over the poster over
     600ms.
  All easing is `--ease-standard`.
- *Desktop, on scroll* (a fine pointer, ≥ 1024): as the hero scrolls away,
  the video scales from 1 to 1.08 and its scrim darkens; the text column
  rises 60px and fades to 40%; the phone rises 120px, faster than the text,
  coming forward. CSS scroll-driven animations (`animation-timeline: view()`)
  only, transform and opacity only, with no scroll listener; where the
  browser lacks them, the hero simply scrolls.
- *Phone:* the same load sequence, shorter (lines 60ms apart over 700ms, the
  subline at 400ms, the actions at 480ms); the light clip after first paint;
  no scroll effect, no phone mock-up.
- *Reduced motion, either source:* the poster only -- the video is never
  requested -- and everything present at first paint, the rule already drawn.
- *No JavaScript:* the load sequence is CSS keyframes with `backwards` fill,
  so it still runs and ends visible; the video, which JavaScript requests,
  never loads, and the poster stays.
- *Save-Data:* as reduced motion for the video; the text sequence still runs.

**Assets.**
- **Desktop cut:** 1920×1080, a seamless 10–14 s loop of four to six 2–3 s
  shots, MP4 (H.264) and WebM (AV1), no audio track, at most 4 MB.
- **Phone cut:** 720×1280 portrait, 8–12 s, aiming at 0.6 MB (§13.4), at most
  1.5 MB.
- **Posters:** each cut's first frame, AVIF and WebP, at most 150 KB (desktop)
  and 60 KB (phone), preloaded per media query with `fetchpriority="high"`.
- **Generation brief** for phase 2: illustrative athletes of different
  genders, ages and builds -- a squat, a deadlift, a bench press, chalk on the
  hands, a plate loaded -- in a gym of concrete and stone, raking warm light,
  deep blacks, graded towards the brand's stone and steel. No logos, no
  branded clothing, no recognisable real person, no visible screen.
- **Phone mock-up:** the live session's presentational set rows and rest bar
  (§7.3), identified at build, in the SVG frame.

**Data.** Synthetic and labelled "Example": Squat / Sentadilla (the catalog's
names, through [catalog.ts](../i18n/catalog.ts)), sets 1 and 2 done at 80 kg ×
5 and set 3 ticked at 85 kg × 5, which is the record, in kilograms in both
languages. No placeholder figures here; those are
the proof band's (§12.3).

**SEO.** The headline is the page's `h1`; the title is "Sunnsteel — Forge
yourself. Prove it in every set." / "Sunnsteel — Fórjate. Demuéstralo en cada
serie."; the description is the subline.

**Accessibility.** The video and the mock-up are `aria-hidden`; the video has
no sound, so no captions. The pause control (44px, after the actions in the
tab order) satisfies WCAG 2.2.2 for the looping video, and a paused video is
remembered on the device (`localStorage`, read in `try`/`catch`). The
headline's line wrappers are spans inside one `h1`, so it is read as one
sentence.

**Acceptance checks.** The first viewport at 390×844 holds the eyebrow, the
headline, the subline, both actions and the install line in English and in
Spanish; nothing overflows at 320; the poster is the LCP element; the video
is never requested under reduced motion or `Save-Data`; pause works and is
remembered; the phone's script ends within 5 seconds and replays on re-entry;
text over the video reaches 4.5:1 on each cut's brightest frame in both
themes.

**Needs from §33.** The display and lead ranks; the image scrim; the Night
scope over imagery; the rule draw at display scale (480ms); the load sequence
on public pages, which §9.2 forbids in the app; scroll-driven motion; the
video pause control.

### 12.3 Proof band — `SiteProofBand`

*Approved 2026-11-20: two usage figures as placeholders and two true facts;
the numbers count up; the band is the hero's dark foot.*

**Job.** Back the offer with figures in one glance, straight under the hero,
and still stand on launch day if no real usage figure is ready.

**Content and copy** (`site.proof`), four cells, each a numeral and a label:

| Cell | Figure | English label | Spanish label | Source |
| --- | --- | --- | --- | --- |
| 1 | 12,400 / 12.400 | MEMBERS | MIEMBROS | **placeholder** |
| 2 | 350,000 / 350.000 | WORKOUTS LOGGED | ENTRENAMIENTOS REGISTRADOS | **placeholder** |
| 3 | 80+ | EXERCISES IN THE CATALOG | EJERCICIOS EN EL CATÁLOGO | true: the seeded catalog (`exercise-catalog.ts`, 80 today), confirmed against production before launch |
| 4 | FREE / GRATIS | TO START | PARA EMPEZAR | true |

**Reserve facts**, true today and drawn from contracts rather than typed: the
milestones in the achievement catalog (25) and the ranks on the ladder (6),
labelled MILESTONES TO EARN / LOGROS POR GANAR and RANKS TO REACH / RANGOS POR
ALCANZAR. **A production build renders each placeholder as the next reserve
fact**, in order, so production shows 80+ exercises, 25 milestones, 6 ranks
and Free until real usage figures exist. Outside production each placeholder
cell carries a small "Mock" / "Ejemplo ficticio" tag (label rank, `--ink-3`,
dashed rule), so nobody reviewing a preview mistakes it.

Numbers are formatted by the language (`numberFormatter`): "12,400" in
English, "12.400" in Spanish. "80+" keeps its plus, which stays true as the
catalog grows.

**Real usage figures**, when the owner wants them, need a read the site does
not have: a public, cached aggregate from the backend (members, finished
workouts) revalidated about once a day, shown only above the owner's
threshold. That is decided before launch and is the one backend change
`SITE-01` might need.

**Layout.**
- **Ground:** the hero's Night region continues (dark in both themes) and the
  hero's phone stands on it. The page's own theme begins with section 4.
- **The band is ruled** (§25.3): a rule above and below, `--rule-faint`
  hairlines between cells, no boxes and no rule at either end.
- **≥ 1024:** one row of four cells in columns 1–8, clear of the phone in
  columns 9–12; cells top-aligned, a label allowed two lines.
- **768–1023:** one row of four across the width.
- **< 768:** two by two, starting inside the first viewport at 390×844 (§12.2).
- **Numerals** in a display numeral rank from §33 (Bebas Neue,
  `clamp(40px, 5vw, 64px)`); labels in the label rank. Each numeral also
  renders its final value invisibly underneath to hold its width, so the
  count never reflows the row.

**Motion.**
- *Desktop:* the first time at least half the band is in view, the rules
  above and below draw from the left over 480ms, then the hairlines top to
  bottom over 240ms, 80ms apart; each number counts from 0 to its value over
  1200ms (`--ease-standard`, which slows into the value), cells 120ms apart,
  each frame formatted by the language; "80+" counts to 80 and then shows its
  plus; FREE / GRATIS rises 8px and fades in. Once per visit (motion spec
  §1.3), never again on re-entry.
- *Phone:* the band is in view at load, so the same sequence starts when the
  hero's text has landed (about 900ms after first paint).
- *Reduced motion:* final values and drawn rules at first paint.
- *No JavaScript:* the final values are in the HTML. Numerals hide before
  counting only under a `js` class an inline script sets before paint, so
  without JavaScript nothing is hidden and nothing flashes.

**Assets.** None.

**Data.** `lib/site/proof-figures.ts`: the four cells and the reserves, each
with its source (`placeholder` or `fact`); the 25 and the 6 read from
contracts' achievement catalog and rank ladder; the 80 a constant beside a
note to confirm it against production. `proofCellsFor(environment)` returns
what renders, and a unit test holds that the production result has no
placeholder.

**Accessibility.** A `section` named "In figures" / "En cifras"; each cell's
counting value is `aria-hidden` and its final value is in visually hidden
text, so a screen reader hears "12,400 members" once, not a count; the Mock
tag is read ("Example figure" / "Cifra de ejemplo").

**Acceptance checks.** A production render shows no placeholder and no Mock
tag; a preview shows the tags; numbers group by language; the band adds no
layout shift while counting; Spanish labels take at most two lines at 1024
and at 320; the count runs once per visit and screen readers hear only final
values.

**Needs from §33.** The display numeral size; counting numbers on public
pages; the Night region continuing under the hero.

### 12.4 The four verbs — `SiteVerbs`

*Approved 2026-11-20: a fixed stage on desktop where one phone stays while the
verbs scroll past; the Spanish verbs in the imperative; Train shows plates and
warm-ups. Titles and bodies are draft.*

**Job.** Show the whole product in four moves, each proven by the app's own
screen, and send each move to its feature page.

**Content and copy** (`site.verbs`). The section's `h2` is the four words:
"Plan. Train. Measure. Earn." / "Planifica. Entrena. Mide. Gana." Each verb
is a panel with a number, an `h3`, a body, a link, a phone script and a
callout card:

| | 01 Plan / Planifica | 02 Train / Entrena | 03 Measure / Mide | 04 Earn / Gana |
| --- | --- | --- | --- | --- |
| Title *(draft)* | Build your routine, or start from a template / Arma tu rutina o empieza con una plantilla | Load the bar without doing the maths / Carga la barra sin hacer cuentas | See what is really moving / Mira qué avanza de verdad | Records, milestones and ranks you earn by training / Récords, logros y rangos que se ganan entrenando |
| Body *(draft)* | Weekly or rotating schedules, rep ranges that progress by themselves, 8-week blocks and deloads when you need them. / Semanas fijas o rotaciones, rangos de repeticiones que progresan solos, bloques de 8 semanas y descargas cuando las necesites. | Your last numbers beside every set, a rest timer that starts by itself, the plates for each side and a warm-up ramp worked out from your working load. / Tus últimos números junto a cada serie, un descanso que arranca solo, los discos de cada lado y una rampa de calentamiento calculada desde tu carga de trabajo. | Strength by estimated 1RM, the muscles you trained each week on a body map, body progress, and signals that state numbers, never verdicts. / Fuerza por 1RM estimado, los músculos que entrenaste cada semana en un mapa corporal, tu progreso físico y señales que dan números, nunca veredictos. | Every record is found in your sets. Milestones and six ranks reward showing up, never posting. / Cada récord sale de tus series. Los logros y los seis rangos premian que vengas a entrenar, no que publiques. |
| Link | See the routine builder → `/features/routine-builder` / Ver el constructor de rutinas | See the workout tracker → `/features/workout-tracker` / Ver el registro de entrenamiento | See progress → `/features/progress` / Ver el progreso | See ranks and achievements → `/features/ranks` / Ver rangos y logros |
| Phone script (≤ 5 s) | The Upper / Lower template card is tapped; its four days slide in one after another; the first day opens on four exercises reading "3 × 8–12 · double progression". | The plate calculator for 100 kg: the bar, then 25 and 15 slide onto each side one by one; under it the warm-up ramp fills row by row (bar × 10, 40 × 5, 60 × 3, 80 × 2). | The strength chart's line draws from left to right; the body map's muscles shade in, band by band. | The Artisan crest draws itself (§24.4); the rank's name appears; the milestone row `sessions:50` ("50 Sessions", by its catalog title) ticks in. |
| Callout card | Upper / Lower · 4 days a week / Superior / inferior · 4 días por semana | 100 kg · 25 + 15 per side / 100 kg · 25 + 15 por lado | Bench press · e1RM 102 kg · +4 kg in 8 weeks / Press de banca · 1RM est. 102 kg · +4 kg en 8 semanas | Rank reached · Artisan / Rango alcanzado · Artesano |

Names are the app's own: the templates and ranks come from their message
areas and the catalog (`Superior / inferior`, `Artesano`), never retyped. The
Measure callout's rise is an up-arrow glyph in ink, not honour; the Earn crest
is in its rank pigment with the name in ink (§19). No honour mark appears in
this section.

**Layout.**
- **Ground:** the page's own theme starts here (Stone or Night).
- **The four words** open the section in the display rank,
  `clamp(32px, 4.6vw, 64px)`, on one line from 1024 and two lines (two words
  each) below; each word ends in a full stop in ink.
- **≥ 1024, the stage:** the verb panels in columns 1–6, each at least 80svh
  tall with its text centred in it; the phone in columns 8–12, `position:
  sticky`, held at the viewport's centre while the panels pass (about 320svh
  in all). A vertical rule runs beside the panels with four ticks, the current
  one filled. The callout card overlaps the phone's lower-left corner: a
  ruled card on `--surface` with the small radius and no shadow (elevation is
  tone, §8). The phone is the 320px SVG frame of §7.1 with the "Example" mark.
- **768–1023 and < 768:** no stage; each verb stacks its number, title, body,
  link, then its phone (280px, 260px below 768) with the callout card under
  it.
- No filled action here; the links are link-style controls.

**Motion.**
- *The four words:* when in view, each rises from behind a mask over 900ms,
  120ms apart; then the rule draws under the line (480ms).
- *Desktop stage:* the active verb is the panel whose middle is nearest the
  viewport's centre (an IntersectionObserver on a centre band, never a scroll
  listener). On a change, the outgoing screen fades and rises 24px (300ms,
  `--ease-exit`) as the incoming one rises from 24px below and fades in
  (500ms, `--ease-standard`); 150ms later its callout card rises 16px into
  place (500ms) while the old one leaves (200ms); the rail's filled tick moves
  (300ms, transform); the active panel's text is in ink, the others in
  `--ink-3`, changing over `--motion-base`. Then the incoming screen plays its
  script once. Scrolling back reverses to the earlier verb. The callout card
  also drifts 40px against the scroll (a CSS scroll-driven animation,
  transform only).
- *Stacked (below 1024):* each panel, the first time it is in view: text
  rises 12px and fades in (600ms), its phone rises 32px and fades in (700ms),
  the script plays, then the callout card rises. Once per visit.
- *Reduced motion:* the stage still holds the phone, but every change is
  instant; screens show their final states; the words are simply there.
- *No JavaScript:* the stacked layout at every width, each phone in its final
  state; the stage is switched on by the `js` class.

**Assets.** Four mock-ups (§7.3) built from the app's presentational parts,
identified at build: the starter template card and the builder's day list;
the plate calculator's bar figure and the warm-up ramp rows; the strength
chart and `MuscleMap`; `RankCrest` and a milestone row. Each loads as a client
island when the section comes within two screens, and counts against §5's
script budget.

**Data.** Synthetic and labelled "Example": the Upper / Lower template, a
100 kg working load with 20 kg bar and the gym's default plates, a bench
press at 102 kg estimated 1RM rising 4 kg over 8 weeks, a weekly body map in
the §32 bands, the Artisan rank and the `sessions:50` milestone (both real
catalog entries, named through the catalog).

**Accessibility.** The `h2` is the four words and each panel's title an
`h3`; the phones, the rail and the callout cards are `aria-hidden`, because
each panel's text already says what its phone shows; the sticky phone never
traps scrolling or focus; the links stay in reading order.

**Acceptance checks.** From 1024 to 1440 the phone stays pinned and swaps as
each panel crosses the centre, forwards and backwards; each script ends
within 5 seconds; nothing shifts layout during a swap; Spanish titles take at
most two lines in columns 1–6 at 1024; at 320 and 390 each phone and its card
fit the width; without JavaScript the stacked layout shows all four final
states.

**Needs from §33.** The sticky stage; drawing an SVG chart line
(`stroke-dashoffset`) on public pages; per-section entrances on public pages,
which §9.2 forbids in the app; callout cards overlapping a phone.

### 12.5 Tools for every workout — `SiteTools`

*Approved 2026-11-20: a bento grid in place of "the workout, in motion";
automatic progression large, and rest, supersets and swapping small. Copy is
draft except where it restates a rule.*

**Job.** Show the tools that make a workout easier, leading with the promise
under every routine -- the weight goes up when you earn it -- without
repeating the hero or section 4.

**Content and copy** (`site.tools`). The `h2` *(draft)*: "Tools for every
workout" / "Herramientas para cada entrenamiento". Four cards, each an
eyebrow (label rank), an `h3`, a body and a mock-up:

| Card | Eyebrow | Title *(draft)* | Body | Link |
| --- | --- | --- | --- | --- |
| Large | AUTOMATIC PROGRESSION / PROGRESIÓN AUTOMÁTICA | Reach the top of your range. The weight goes up. / Llega al tope de tu rango. El peso sube. | When every set reaches the top of its rep range, your next workout is loaded with one more step -- 2.5 kg unless you choose another. Fall short and the weight you lifted carries over. / Cuando todas las series llegan al tope de su rango, el siguiente entrenamiento sube un paso de peso: 2,5 kg si no eliges otro. Si no llegas, se mantiene el peso que levantaste. | See automatic progression → `/features/progression` |
| Small | REST / DESCANSO | Rest that starts itself / Un descanso que arranca solo | It starts when you tick a set and tells you when it is over, even with the screen locked once the app is installed and notifications are on. / Arranca al tildar la serie y te avisa cuando termina, incluso con la pantalla bloqueada si instalaste la app y activaste las notificaciones. | — |
| Small | SUPERSETS AND CIRCUITS / SUPERSERIES Y CIRCUITOS | Link exercises and train in rounds / Enlaza ejercicios y entrena por rondas | Up to six exercises in a group, one set of each per round, each keeping its own loads and progression. / Hasta seis ejercicios en un grupo, una serie de cada uno por ronda, y cada uno conserva sus cargas y su progresión. | — |
| Small | SWAP AN EXERCISE / CAMBIAR UN EJERCICIO | Machine taken? Swap it for today. / ¿Máquina ocupada? Cámbiala por hoy. | Close alternatives ranked by movement and muscles, and your routine stays as it is unless you choose to update it. / Alternativas parecidas, ordenadas por movimiento y músculos, y tu rutina queda igual salvo que elijas actualizarla. | — |

**The large card's body restates the server's rule exactly**
(`buildProgressionOutcome` in the backend's `progression-changes.ts`, scheme
`DOUBLE_PROGRESSION`): the weight rises by the exercise's step (default 2.5 kg)
only when every working set reached its target -- a range's top -- and
otherwise the weight lifted carries into the routine. It never says the app
adds reps: the member does, within the range. The rest card never promises a
countdown on the lock screen, which no platform can show (backend
`CLAUDE.md`): the alert is one line, worded as the server words it.

**Mock-up scripts** (each at most 5 seconds, §7.3):
- **Large -- a progression ledger**, rows in Space Mono under the headings
  Workout · Weight · Reps / Entrenamiento · Peso · Reps, typed in about 0.6s
  apart: 1 · 80 kg · 8, 8, 8 — 2 · 80 kg · 9, 9, 8 — 3 · 80 kg · 10, 10, 9 —
  4 · 80 kg · 12, 11, 11 — 5 · 80 kg · 12, 12, 12, where each 12 gets the
  set-completion mark as the row lands; then row 6 · 82.5 kg arrives with
  "+2.5 kg" and an up-arrow glyph in ink while a rule draws under it. Bench
  press, range 8–12, step 2.5 kg. **A unit test runs the example through the
  same rule**, so the ledger can never show a step the app would not make.
- **Rest:** the rest bar drains from 1:30 to 0:00 (time compressed, the
  digits in their fixed slot), then an original, platform-neutral
  notification card slides down over the frame: "Rest is over · Bench Press
  is up next." / "Terminó el descanso · Sigue: Press de banca." -- the
  server's `restOverTitle` and `restNextBody`.
- **Supersets:** two exercise rows, A1 and A2 ("Superset A" / "Superserie A",
  the app's group label); the link bracket draws between them; "Round 2 of 3"
  / "Ronda 2 de 3" ticks to 3 as each row's set completes.
- **Swap:** a Leg Press row; its menu opens on alternatives; Hack Squat (same
  movement) is chosen and the row updates with the app's caption "Swapped
  from Leg Press" / "Cambiado desde Prensa de piernas" (names through the
  catalog).

**Layout.**
- **Ground:** the page's theme. Cards on `--surface` with a `--rule` border
  and the small radius, no shadow; the grid's gaps are the ground.
- **≥ 1024:** a bento on 12 columns: the large card in columns 1–7 spanning
  the height of the three small cards stacked in columns 8–12; about 720px
  tall. Text sits at each card's top, its mock-up below.
- **768–1023:** the large card full width (text left, ledger right), then the
  small cards full width, each with its text left and mock-up right.
- **< 768:** every card stacked, text first, mock-up under it at full width.
- No filled action; the large card's link is link-style.

**Motion.**
- *Heading:* the `h2` rises from behind a mask line by line (900ms) and its
  rule draws (480ms).
- *Desktop entrance:* when the grid is 30% in view, the large card rises 24px
  and fades in (700ms), then the small cards, 120ms apart; the column of
  small cards drifts up to 30px against the large one as the page scrolls
  (CSS scroll-driven, transform only).
- *Desktop scripts:* one loop at a time (§7.3), so the grid plays as a
  sequence -- the ledger, then rest, supersets and swap -- each after the one
  before ends, about 15 seconds in all, then every card rests on its final
  state; the sequence plays again when the grid re-enters the view.
- *Below 1024:* each card's entrance and script run when that card is at
  least half in view, once per entry.
- *Reduced motion:* final states, no entrance, no drift.
- *No JavaScript:* final states in the HTML.

**Assets.** Mock-ups from the app's presentational parts, identified at
build: a ledger built from the exercise-performance history's set rows (or
the site's own ruled table in the same type ranks, if those rows carry data
hooks), the live session's rest bar, a platform-neutral notification card
drawn for the site, the session's superset group rows and round line
(`LIVE-14`), and the swap dialog's alternative rows (`LIVE-11`).

**Data.** Synthetic and labelled "Example": Bench Press at 80 kg in an 8–12
range with the default 2.5 kg step; Leg Press swapped for Hack Squat (both
catalog exercises, named through the catalog); a 90-second rest.

**Accessibility.** The `h2`, then an `h3` per card; mock-ups `aria-hidden`,
each card's text saying what its mock-up shows; the sequence holds no focus
and needs no control, since every script ends within 5 seconds.

**Acceptance checks.** The ledger example passes the progression rule's test;
the rest card's lines match the server's copy in both languages; the
sequence runs one script at a time and replays on re-entry; Spanish titles
fit two lines in the small cards at 1024 and at 320; nothing shifts layout
while a script plays; final states without JavaScript and under reduced
motion.

**Needs from §33.** Boxed cards on the public site (a bento); the sequenced
scripts; the scroll-driven drift.

## 13. Reference review: Boostcamp's public site (2026-11-20)

Reviewed at the owner's request before §12: the home, `/features`, one
feature page (auto progression), `/use-cases`, the intermediates page, `/pro`
and the home at 390. Full-page captures are kept **locally, outside every
repository**, in `branding-explorations/boostcamp-reference-2026-11-20/`
(excluded in the root checkout's `.git/info/exclude`); they are reference,
never assets, and nothing of their look, copy, figures or imagery is reused.
What follows is structure and technique, in our words.

### 13.1 How the site is organised
- **Top bar:** logo; Home, Programs, a *Product* mega menu and a *Resources*
  menu; a ghost Log in and one filled primary action. The Product menu has
  three columns: **Features** (all features plus five feature pages),
  **Use cases** (all, by experience -- beginners, intermediates, advanced --
  and by goal) and **Plans** (the free app, "is it free?", Pro, download).
  Below `md` it is the logo, the primary action and a menu button.
- **Footer:** five link columns (product, resources, research, company,
  download) under the logo and the support address.
- **Use-case pages sit at the root** (`/beginners`, `/intermediates`,
  `/advanced`); feature pages under `/features/<slug>` -- fifteen of them,
  grouped Programs, Train, Analytics, Community, Integrations, each marked
  Free, Pro or Free + Pro on the overview.

### 13.2 The home, section by section
1. **Hero:** a full-bleed, muted, looping video montage of people training
   under a dark scrim; a proof badge; a very large condensed uppercase
   headline with one word in the accent colour; a two-line subline; the
   store badges. On load the badge, each headline line and the subline rise
   in a short stagger (about 1.1 s each, lines about 90 ms apart).
2. **Stats band:** four figures in ruled cells (three at 390).
3. **Track · Follow · Build · Measure:** four huge words with an accent full
   stop, four phones, a floating "toast" card under each phone (a logged set,
   a programme, a toggle, a score), then a title and two lines per column.
4. **Programme picker:** a dark band with a coverflow carousel of category
   cards (the centre card full size, neighbours at 85, 70 and 55 % and
   fading), with category tabs under it.
5. **Tools:** a bento grid -- one tall card and two short ones -- each with an
   eyebrow, a condensed headline and a phone.
6. **Results:** horizontally scrolling before/after cards with a drag
   slider, the change as a big number, a quote and a name.
7. **Coaches:** one featured coach, large name and figures, a photo card and
   a strip of avatars that selects the coach.
8. **Testimonials:** a ruled grid of six quotes with their source.
9. **Closing band:** a second background video, the headline, the store
   badges and, on desktop, a **QR card to open the app on a phone**.
10. **Questions**, then the footer.

### 13.3 The page templates
- **Feature page** -- a guide, not a showcase: breadcrumb with a Free/Pro
  badge, title, subline and an "Updated <month>" line; an overview card with
  three highlights and a grid of facts (method, cadence, step, price);
  numbered "how it works" steps; the idea explained; **a worked example as
  a session-by-session table**; what it covers, as a table; tips; related
  programmes; the Pro note; related features; questions. No video and almost
  no motion.
- **Use-case page:** an eyebrow ("For intermediates · Free"), the headline,
  a subline, two actions and an audience line; a stats band; **"what
  changes" at this level** in four numbered cards; the programmes for the
  level; the tools that matter at it; **a numbered step-by-step to the next
  level**; a card linking to the next level; the download band; questions.
- **Pro page:** the headline; a band with the price, the trial and "cancel
  anytime"; what Pro adds in six cards; Free beside Pro in two columns; the
  two prices; who it is for; a link to every feature; the trial band;
  questions.

### 13.4 Motion, as built
All of it is CSS keyframes and transitions toggled when an element enters
the viewport -- no animation library, no scroll-linked timelines. Headings
rise from behind a mask word by word (about 1 s); text and cards fade up
(about 0.9 s); phones fade in and their toast cards slide up; **the UI inside
the phone mock-ups is animated HTML** (a tap ripple, a tick, plates sliding
onto the bar, a blinking cursor); avatar strips stagger in at about 24 ms per
item; the carousel and the before/after slider move on input; the header is
sticky. **The cinema is on the home only**: the feature, use-case and Pro
pages are quiet. Videos: the desktop hero is a full-width montage; phones get
**a separate 960×540, 12.6 s clip of about 0.6 MB** with `preload="none"`,
and the closing video loads its source only when near.

### 13.5 What Sunnsteel takes, subject to §12
- The **mega menu** with Features, Use cases and Plans columns (§4.1); in our
  Plans column, Pricing, "Is Sunnsteel free?", Pro and **Install the app**.
- **A hero video at about 0.6 MB on phones**, separate from the desktop cut,
  which tightens §5's budget for the phone clip.
- The **four-verb section with a floating card under each phone** -- in our
  case a real fact of the app (a set ticked, a record, a rank) on a ruled
  card.
- The **bento grid** for the tools section, and a **coverflow** for the
  starter templates (three, so the coverflow becomes a row that brings one
  forward).
- **Feature pages as exact guides**: a worked example table suits Sunnsteel
  (double progression on a real rep range, an 8-week block's loads, a deload
  preview), and every number in it comes from contracts' own rules.
- **Use-case pages built on "what changes" and a step-by-step to the next
  level**, each linking to the next level and to its starter template.
- The **pricing page's** band of facts (price, trial, cancel anytime), Free
  beside Pro, and "who it is for".
- **A QR card on desktop to open the site on a phone**, which suits a PWA:
  the visitor installs it where they train.
- Questions on every page (with `FAQPage` structured data), an "Updated
  <month>" line, and cross-links between levels and features.
- The motion vocabulary of §13.4, declared per section in §12, with ours
  added on top (rule draw, crest draw, set completion).
- **Animated HTML inside the phone mock-ups**, the reference's way, adopted
  by the owner (§7.3).

### 13.6 What Sunnsteel refuses
Their figures, star ratings, store badges, testimonials and before/after
photos (we have no true equivalent: §6.2), coach programmes (Sunnsteel has
none), yellow on black, the condensed grotesk, and any of their words. Use
cases by goal stay out (§11).
