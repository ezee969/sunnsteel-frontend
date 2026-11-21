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
  profile, a shared workout, a search or word of mouth, often on a phone: a
  varied audience, **in English first** (the owner, 2026-11-21), with Spanish
  written alongside. Pro is sold in Argentina (ARS, `BILL-06`), which is an
  open question for that audience (§11).
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
   and level; each links to `/signup?template=<slug>`, and the template
   reaches the builder through sign-up and onboarding (§12.8).
9. **Train with people** (§12.9) — follow, training partners, messages; you choose who sees each part. (This line used to say every
   setting starts private, which is untrue for new accounts.)
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
  on any phone; keeps logging when the connection drops and sends the changes
  when it returns, while the app stays open (`TRUST-03`: waiting changes are
  held in memory, not stored); English and Spanish; your data exportable and
  deletable; you choose who sees each part of your profile. Never "private by
  default": new accounts start at Followers.
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
| 23 | Section 6 | A large body map whose weeks advance with the scroll, then four analysis cards tagged Free or Pro; the training review here, the routine draft in the Pro section (§12.6) |
| 24 | Ranks | A climb with the scroll: each step draws the next crest and dresses a "Your name" profile header in that rank; phones get the ladder and one Artisan header (§12.7) |
| 25 | Templates | A carousel by level; "none of these?" offers building your own and describing it (Pro); the chosen template travels through sign-up and onboarding into the builder (§12.8) |
| 26 | People | Three animated scenes (activity, partners, messages) and a privacy band; message encryption answered in the questions (§12.9) |
| 27 | Free and Pro | Two equal cards side by side (Free first on phones); "Try Pro free for 7 days" filled; the Pro intent carried through sign-up to `/plans`, charging nothing by itself (§12.10) |
| 28 | Questions | One list of twelve, including messages not being end-to-end encrypted and what the AI receives; payment detail on `/pricing` (§12.11) |
| 29 | Closing band | A second generated clip on desktop (poster on phones), "Empieza a forjarte.", and a desktop QR card that opens the site on a phone with an install helper (§12.12) |
| 30 | Footer | Site map, help, legal pages and the two legal buttons; no seller identification (§12.13) |
| 31 | Public pages | Four templates and an outline per page, in one pass (§12.14–12.21) |
| 32 | Feature pages | A guide under an animated header, worked examples computed from the product's own rules (§12.15–12.16) |
| 33 | `/pricing` signed in | Redirected to `/plans` (§12.20) |
| 34 | Audience (2026-11-21) | A varied audience, English first, Spanish written alongside -- replacing "mostly Spanish (Argentina)" in §2; recorded in `PRODUCT.md` |
| 35 | Evidence (2026-11-21) | None real; everything shown is mock-up, labelled, with placeholders replaced by true facts in production |
| 36 | Build path (2026-11-21) | Comp-first (`.impeccable/config.json`) |
| 37 | Encouragement (2026-11-21) | Partner encouragement (`SOC-09`) never appears on the site -- "too corny"; the partners scene shows what partners share and the partner alert instead (§12.9) |

**Open, from §34:** Pro is priced in ARS through Mercado Pago Argentina,
which an international English audience may not be able to pay; how Pro is
offered to it is undecided (recorded in `PRODUCT.md`).

**Progress:** phase 0 done 2026-11-21 (`PRODUCT.md`, the site's surface brief
in `.impeccable/surfaces/`, the build path); phase 1's copy deck, part 1 (the
landing), is [site-01-copy-deck.md](site-01-copy-deck.md), approved by the
owner on 2026-11-21, and part 2 (the eleven public pages) is
[site-01-copy-deck-pages.md](site-01-copy-deck-pages.md), drafted for
approval.

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

Sections are numbered as in §4 (12.1 the top bar … 12.13 the footer), and
the public pages of §4.1 follow. Items a section needs from design-system
amendment §33 are listed at its end; they are collected in **the draft of §33
in [ui-design-system.md](ui-design-system.md)** (2026-11-21, not in force until
the owner approves it with the comps).

**Free and Pro are always told apart.** Wherever the site names a capability
Pro unlocks, it carries the Pro tag the app already uses (§29.2's locked
option label, a word and never a colour alone), and every tag and every plan
number (weeks of history, drafts and reviews a month) is derived from
contracts' `PLANS` and `FEATURE_KEYS`, never typed; a unit test fails when a
tag disagrees with contracts. Today Pro unlocks, among what the site shows:
8-week blocks, dated training blocks, planned deloads, training signals and
the deload suggestion, block and session comparison, strength ranges past 90
days, muscle history past 4 weeks (12 on Pro), body measurements beyond
weight, goal suggestions, routine drafts and the training review. Plateau
watch, records, ranks, the body map within 4 weeks and everything in the
workout itself are free.

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
| Body *(draft)* | Weekly or rotating schedules and rep ranges that progress by themselves; with **Pro**, 8-week blocks and planned deloads. / Semanas fijas o rotaciones y rangos de repeticiones que progresan solos; con **Pro**, bloques de 8 semanas y descargas planificadas. | Your last numbers beside every set, a rest timer that starts by itself, the plates for each side and a warm-up ramp worked out from your working load. / Tus últimos números junto a cada serie, un descanso que arranca solo, los discos de cada lado y una rampa de calentamiento calculada desde tu carga de trabajo. | Strength by estimated 1RM, the muscles you trained each week on a body map and your weight over time; with **Pro**, training signals that state numbers, never verdicts. / Fuerza por 1RM estimado, los músculos que entrenaste cada semana en un mapa corporal y tu peso a lo largo del tiempo; con **Pro**, señales de entrenamiento que dan números, nunca veredictos. | Every record is found in your sets. Milestones and six ranks reward showing up, never posting. / Cada récord sale de tus series. Los logros y los seis rangos premian que vengas a entrenar, no que publiques. |
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

### 12.6 Progress you can read — `SiteProgress`

*Approved 2026-11-20: a large body map whose weeks advance with the scroll,
then a strip of analysis cards; the training review belongs here. Copy is
draft.*

**Job.** Show that progress is read from the member's own sets, week by
week, at full size -- the phone in section 4 only previews it -- and that the
analysis states numbers, never verdicts.

**Content and copy** (`site.progress`). The `h2` *(draft)*: "Progress you can
read" / "Un progreso que se puede leer". Two parts.

**A. The map stage.**
- `h3` *(draft)*: "Every set you log lands on the map" / "Cada serie que
  registras llega al mapa"; body *(draft)*: "Weekly sets per muscle on a
  body map, front and back, beside the number behind every colour, and your
  estimated 1RM week by week." / "Series semanales por músculo en un mapa
  corporal, de frente y de espalda, junto al número detrás de cada color, y
  tu 1RM estimado semana a semana."
- The **week rail**: Week 1 · 2 · 3 · 4 / Semana 1 · 2 · 3 · 4, and under it
  "Four weeks free, up to twelve with Pro." / "Cuatro semanas gratis, hasta
  doce con Pro." -- both numbers from contracts' `MUSCLE_HISTORY_WEEKS`.
- The **map**: `MuscleMap`, front and back, in the §32 bands with its legend
  ("Weekly sets per muscle" / "Series semanales por músculo") and its list
  ("Sets per muscle" / "Series por músculo"), worded by the app's own
  `progress.bodyMap` messages.
- The **strength line**: "Bench Press · estimated 1RM" / "Press de banca · 1RM
  estimado", its latest value in Space Mono.

**B. The analysis strip**, four cards, each a name, its plan tag, one
sentence and a small mock-up state:

| Card | Plan | Sentence *(draft)* | Mock-up |
| --- | --- | --- | --- |
| Plateau watch / the app's Spanish heading | Free | Lifts with no new best after several sessions, with the rule printed above them. / Ejercicios sin una nueva mejor marca después de varias sesiones, con la regla escrita arriba. | "Squat · No new best in 4 sessions" / "Sentadilla · Sin nueva mejor marca en 4 sesiones" (the app's `noNewBest`) |
| Training signals / Señales de entrenamiento | Pro | Effort, rep targets, declines and workouts over two weeks against the two before; a change is marked, never explained. / Esfuerzo, objetivos de repeticiones, caídas y entrenamientos en dos semanas frente a las dos anteriores; un cambio se marca, nunca se explica. | The effort row with its warning mark and the word "Changed" / "Cambió" |
| Deload suggestion / Sugerencia: una semana más liviana | Pro | When a load signal holds, it proposes a lighter week with its dates; nothing changes until you save it. / Cuando una señal de carga se mantiene, propone una semana más liviana con sus fechas; nada cambia hasta que la guardas. | The suggestion row with its dates and an outline "Plan this deload" / "Planificar esta descarga" |
| Training review / Revisión del entrenamiento | Pro | Pick a question and a few workouts: the answer describes your logs, cites every number from them and never guesses a cause. / Elige una pregunta y algunos entrenamientos: la respuesta describe tus registros, cita cada número y nunca adivina una causa. | The question "What changed between these workouts?" / "¿Qué cambió entre estos entrenamientos?" and one finding whose figures are links |

Names, questions and row wording are the app's own messages (`progress`,
`planning`), never retyped. The routine draft, the other AI feature, is named
in the Pro section (§12.10); where answers are written and what is sent is
said in the questions (§12.11), as the app says it.

**Layout.**
- **Ground:** the page's theme.
- **≥ 1024, the stage:** sticky, about 300svh. The text, the week rail and
  its plan line in columns 1–4; the map, front and back side by side (about
  520px tall), in columns 5–9; the list in columns 10–12, with the strength
  line under the map across columns 5–12. Four invisible step markers, one
  per week, pass the viewport's centre as the page scrolls.
- **Below 1024:** no stage: the text, the rail, the map (front and back side
  by side from 390, stacked below), the list and the line, one after another.
- **The strip:** four cards in a row from 1024, two by two at 768, stacked
  below; ruled cards on `--surface` with the small radius, the plan tag in
  each card's corner.

**Motion.**
- *Heading:* line rise and rule draw, as every section.
- *Desktop stage:* each week marker reaching the centre advances the week
  (an IntersectionObserver, never a scroll listener): each muscle's fill
  crossfades to its new band (400ms, `fill`), the list's numbers count to the
  week's values (400ms) and re-sort, the strength line draws one more segment
  (400ms, `stroke-dashoffset`) and its value counts, and the rail's dot slides
  (300ms, transform). Scrolling back steps back. The stage starts at week 1,
  so the first frame is sparse and the map fills as the visitor reads.
- *Below 1024:* when the map is half in view, the four weeks play by
  themselves, 1.2s apart (under 5 seconds), and rest on week 4; once per
  entry.
- *The strip:* the cards rise 24px and fade in, 120ms apart; each mock-up
  makes one move as its card lands (the "Changed" mark appears, the finding's
  figures underline) and rests.
- *Reduced motion:* week 4 at once, every value final, no stage scrolling
  behaviour, the cards present.
- *No JavaScript:* the stacked layout at week 4; the stage is switched on by
  the `js` class.

**Assets.** `MuscleMap` and its generated figure (§32), the strength chart's
line, and the presentational rows of plateau watch, training signals, the
deload suggestion and the training review, identified at build.

**Data.** Synthetic and labelled "Example", four weeks within the free
window. Weekly sets (chest, back, quadriceps, hamstrings, shoulders, biceps,
triceps, glutes, calves, core), chosen so muscles cross bands as the weeks
pass -- for example chest 8, 10, 12, 14; calves 0, 2, 2, 4; core 0, 0, 2, 4 --
and Bench Press estimated 1RM 99, 100, 101, 102 kg, consistent with section
4's "+4 kg in 8 weeks". Muscle names through the catalog's muscle groups.

**Accessibility.** The stage's visuals are `aria-hidden`; its `h3` and body
say what it shows, and the final week's list is also in visually hidden text
as a list, so no value is announced while scrolling. The cards are real text
with real headings; a plan tag is read as a word.

**Acceptance checks.** Every plan tag and both week numbers come from
contracts and a test holds them; the stage steps forwards and backwards with
the scroll; below 1024 the weeks finish within 5 seconds; Spanish fits the
cards at 1024 and 320; week 4 without JavaScript or under reduced motion.

**Needs from §33.** A second sticky stage; fill crossfades on the body map;
the Pro tag on public pages.

### 12.7 Ranks — `SiteRanks`

*Approved 2026-11-20: a climb with the scroll on desktop, where each step
draws the next crest and dresses a profile header in that rank; six crests and
one decorated header on phones. Copy is draft.*

**Job.** Tell the transformation story Boostcamp tells with before-and-after
photos, in Sunnsteel's honest terms: a rank is earned by showing up, and it
dresses your profile.

**Content and copy** (`site.ranks`).
- `h2` *(draft)*: "Ranks earned by consistency" / "Rangos que se ganan con
  constancia".
- Body *(draft)*: "Six ranks, from Initiate to Laureate, earned by workouts in
  distinct weeks -- attendance, never how much you lift or how often you
  post. Your rank dresses your profile, and you choose who sees it." / "Seis
  rangos, de Iniciado a Laureado, que se ganan con entrenamientos en semanas
  distintas: asistencia, nunca cuánto levantas ni cuánto publicas. Tu rango
  viste tu perfil, y tú eliges quién lo ve."
- **The ladder**, an ordered list of the six, each with its crest, its name
  and its requirement, all read from contracts' `RENAISSANCE_RANK_DEFINITIONS`
  and worded by the app's rank messages:

  | Rank | Requirement (contracts) |
  | --- | --- |
  | Initiate / Iniciado | where everyone starts |
  | Apprentice / Aprendiz | 5 workouts in 3 different weeks |
  | Artisan / Artesano | 15 workouts in 8 different weeks |
  | Maestro / Maestro | 30 workouts in 16 different weeks |
  | Virtuoso / Virtuoso | 60 workouts in 32 different weeks |
  | Laureate / Laureado | 100 workouts in 52 different weeks |

- **The profile header**: the app's own header with its rank decoration
  (§24), for a member named **"Your name" / "Tu nombre"** (@yourname /
  @tunombre) with the initials avatar -- no generated face, and an invitation
  rather than a stranger -- marked "Example", the rank's name in ink under the
  name and the rank's description (the catalog's) under it.
- **Who sees it:** the body says the member chooses; the site never states a
  default, because new accounts and older ones start differently (backend
  `newAccountDefaults`).

**Layout.**
- **≥ 1024, the stage:** sticky, about 360svh, six step markers, one per rank.
  The `h2`, the body and the ladder in columns 1–4; the header in columns
  5–12, where its decoration lays out by its own width as on a profile
  (§24.7: the portrait beside the text from 860px of the header's own width,
  so at 1440 it sits beside, and nearer 1024 above).
- **Below 1024:** the `h2`, the body, the ladder, then one decorated header
  in **Artisan** -- the first framed tier, and a light one (34 KB of
  generated pieces against Laureate's 263 KB) -- in its compact form below
  600px.

**Motion.**
- *Desktop stage:* each step marker reaching the centre makes that rank
  current: its crest in the ladder draws in its pigment (§24.4), the ranks
  below it stay in theirs and those above stay in `--ink-3` (an unreached rank
  is ink-3, §19); the header's current decoration fades out (300ms) and the
  new rank's plays its own entrance (§24.4), and its name and description
  change; the ambient motion runs only while the header is in view, as on a
  profile. Scrolling back steps back, the crests above the current one
  returning to ink-3 at once.
- *Below 1024:* when the ladder is half in view its six crests draw one after
  another, 300ms apart; the Artisan header plays its entrance when it is in
  view; once per entry.
- *Reduced motion:* the phone layout at every width, final states, no
  ambient motion (§24.4 already removes it under both sources).
- *No JavaScript:* the ladder with every crest drawn (inline SVG) and the
  header undecorated, since the decoration loads with JavaScript.

**Assets and weight.** `RankCrest` and the generated decoration modules
(`features/profile/rank-decoration/generated/`), each still loaded by its own
dynamic `import()`: on the desktop stage a rank's module is requested when the
stage is within one step of it, never on the first load, so the climb fetches
about 540 KB of generated JSON (an estimated 150 KB compressed) only for a
visitor who scrolls it all; below 1024 only Artisan's. The weight is measured
at build and counted in §5's budget for the stage, not the first viewport.

**Data.** Synthetic: "Your name", the initials avatar and the six real ranks;
no counts of any member.

**Accessibility.** The ladder is a real ordered list, read in order with
each requirement; crests are `aria-hidden` and never stand without their
name (§19); the header mock is `aria-hidden`, its role said by the body.

**Acceptance checks.** Every requirement comes from contracts and a test
holds it; unreached crests are ink-3; no decoration module loads before the
stage is approached (checked in the network log); the climb steps forwards
and backwards; below 1024 only Artisan's module loads; Spanish names and
requirements fit at 320.

**Needs from §33.** A third sticky stage; the site's profile-header mock as
the one place outside a profile where a rank decoration appears (§24.1 keeps
decoration to its holder's header).

### 12.8 Start with a programme — `SiteTemplates`

*Approved 2026-11-20: a carousel by level; "none of these?" offers building
your own and describing it (Pro); choosing a template carries it through
sign-up into the builder. Copy is draft.*

**Job.** Take a visitor from "this looks good" to "this is my plan": pick a
programme for your level and start from it the moment the account exists.

**Content and copy** (`site.templates`).
- `h2` *(draft)*: "Start with a programme" / "Empieza con un programa".
- Body *(draft)*: "Three programmes to start from, each opening as a draft you
  can change. The loads are yours to fill: a template can't know your
  strength." / "Tres programas para empezar; cada uno se abre como un
  borrador que puedes cambiar. Las cargas las completas tú: una plantilla no
  puede saber tu fuerza." -- the same promise the app's own templates make.
- **Level tabs** (`ToggleRow`, §28): Beginner / Principiante · Intermediate /
  Intermedio · Advanced / Avanzado.
- **The templates are the app's** (`ROUTINE_TEMPLATES` and the
  `routines.templates` messages), never retyped -- names, schedule summary,
  description, day names and each day's exercise count:

  | Level | Template | Schedule |
  | --- | --- | --- |
  | Beginner | Full Body Foundations / Fundamentos de cuerpo completo | Monday, Wednesday, Friday · Full body A, B, C |
  | Intermediate | Upper / Lower / Superior / inferior | Monday, Tuesday, Thursday, Friday · Upper A, Lower A, Upper B, Lower B |
  | Intermediate | Push / Pull / Legs / Empuje / tirón / piernas | a 3-day rotation, Monday to Saturday, each day twice a week |
  | Advanced | none | the "none of these?" card alone |

- **A template card:** its name (`h3`), level and schedule summary, a week
  strip of seven day letters with the training days lit (the rotation lights
  Monday to Saturday with its days in order), the day list with each day's
  exercise count, the description, and **"Start with this one" / "Empezar con
  esta"** -- the region's filled action, shown on the front card only.
- **The "none of these?" card** ("None of these?" / "¿Ninguna te sirve?"),
  last at every level and alone under Advanced: **"Build your own" / "Arma la
  tuya"** (free, outline) → `/signup`, and **"Describe it, get a draft" /
  "Descríbela y recibe un borrador"** (Pro tag) → `/features/routine-builder`,
  where the draft is explained. Under Advanced it adds that the 8-week block
  (Pro tag) is built in the same builder.

**The hand-off.** "Start with this one" goes to `/signup?template=<slug>`
(`full-body-foundations`, `upper-lower`, `push-pull-legs`):
- the sign-up page accepts only a slug `routineTemplateBySlug` knows and
  ignores any other; it keeps the choice on the device (`localStorage`
  `ss-site-template`, for a day, read in `try`/`catch`, because email
  confirmation can open in another tab) and passes it on as the callback
  address of both email confirmation and Google sign-in;
- onboarding's recommendation step (`ONBOARD-01`) offers the chosen template
  first -- "You picked Upper / Lower" / "Elegiste Superior / inferior" --
  instead of computing one, with the weekdays the member gives; its next step
  opens `/routines/new?template=<slug>` as it does today. This changes a
  step's content, not the steps, so `ONBOARDING_VERSION` stays;
- a member who skips onboarding finds the template under Getting Started's
  "Choose a routine";
- **a signed-in visitor** is sent by the middleware from
  `/signup?template=<slug>` straight to `/routines/new?template=<slug>`
  rather than to the dashboard, with a test beside the existing redirect
  tests.

**Layout.**
- **≥ 1024:** the tabs centred above a coverflow: the front card 480px wide;
  its neighbours at 85% size and 60% opacity, offset left and right and
  partly behind it; previous and next buttons (44px) at the sides. Clicking
  a neighbour brings it forward.
- **768–1023:** the same coverflow with the front card at 420px and the
  neighbours at 85% and further behind.
- **< 768:** the tabs full width; the cards in a horizontal scroll-snap row,
  each about 85% of the width with the next one peeking; the snapped card is
  the front one.

**Motion.**
- *Heading:* line rise and rule draw.
- *Changing level:* the cards of the old level fade and move 24px away while
  the new ones arrive from 24px the other side (400ms); then the front card's
  week strip lights its days one after another (60ms apart) and its day rows
  appear 40ms apart.
- *Moving the coverflow:* each card translates and scales to its new place
  (500ms, `--ease-standard`, transform and opacity only), and the new front
  card lights its week strip as above.
- *Hover:* colour only (§9.2).
- *Reduced motion:* instant changes, every card the same size and fully
  opaque, the week strip already lit.
- *No JavaScript:* a plain list by level with headings, every template and
  the "none of these?" card, each with its link.

**Assets.** None; the cards are built from the app's template data and the
site's type ranks.

**Data.** Real, not synthetic: the three approved templates exactly as the
builder opens them.

**Accessibility.** The tabs are the app's `ToggleRow`; the carousel is a list
of cards, each with its `h3`; the previous and next buttons name the template
they bring forward; a polite live region says "Upper / Lower, 1 of 3" when
the front card changes; only the front card's action is in the tab order,
and a neighbour is reached by its own "Show <name>" control.

**Acceptance checks.** Names, days and counts come from the code; the
hand-off reaches the builder with the chosen template through email sign-up
and through Google, onboarding offers it first, an unknown slug is ignored,
and a signed-in visitor lands in the builder; keyboard and swipe both move
the carousel; Spanish fits the front card at 320 and 1024; the plain list
without JavaScript.

**Needs from §33.** The coverflow (scaled and dimmed neighbours) on public
pages.

### 12.9 Train with people — `SitePeople`

*Approved 2026-11-20: three animated scenes, no sticky stage; a privacy band
under them; message encryption is answered in the questions. Copy is draft.*

**Job.** Show that training is better with people -- and free -- without
making the product look like a feed to post to, and say plainly that each
member decides who sees what.

**Content and copy** (`site.people`).
- `h2` *(draft)*: "Train with people" / "Entrena con otros"; a line under it:
  "Free, like everything you do in a workout." / "Gratis, como todo lo que
  haces al entrenar." (social and messages are outside the Pro split).
- **Three scenes**, each an eyebrow, an `h3`, one sentence and an animated
  fragment of the app:

  | Scene | Eyebrow | Title *(draft)* | Sentence *(draft)* | Fragment script (≤ 5 s) |
  | --- | --- | --- | --- | --- |
  | Activity | ACTIVITY / ACTIVIDAD | Follow people, see them train / Sigue a otros y míralos entrenar | Workouts, records and milestones from the people you follow, with four reactions and comments -- nothing to post. / Entrenamientos, récords y logros de la gente que sigues, con cuatro reacciones y comentarios: no hay nada que publicar. | An entry slides in -- "Lu finished Push · 3 records" / "Lu terminó Empuje · 3 récords" -- then Strength / Fuerza is tapped and its count goes from 2 to 3 |
  | Partners | TRAINING PARTNERS / COMPAÑEROS | Train with partners / Entrena con compañeros | Up to 20 partners. Each of you chooses what the other sees, and you can be told when a partner finishes a workout. / Hasta 20 compañeros. Cada uno elige qué ve el otro, y puedes recibir un aviso cuando un compañero termina un entrenamiento. | Lu's partner card shows what each of you shares (activity, progress); then the partner alert slides in, worded as the app words it ("Lu finished Push") |
  | Messages | MESSAGES / MENSAJES | Send what you trained / Comparte lo que entrenaste | One-to-one messages that can carry a routine, a workout, a record, a milestone or a month of training; a stranger's first message waits as a request. / Mensajes uno a uno que pueden llevar una rutina, un entrenamiento, un récord, un logro o un mes de entrenamiento; el primer mensaje de alguien que no sigues espera como solicitud. | A message from Lu arrives with the Upper / Lower routine card; the copy action is tapped and the routine is in "your routines" |

  The reactions (Strength, Discipline, Respect, Inspiring / Fuerza,
  Disciplina, Respeto, Inspirador), the limit of 20, the partner alert's
  wording (`NOTIF-07`) and the six kinds a message carries are the app's and
  contracts' (`TRAINING_PARTNERS_MAX`), never retyped; so is the clone
  action's label. **Partner encouragement (`SOC-09`) never appears on the
  site** (the owner, 2026-11-21: too corny).
- **The privacy band**: `h3` *(draft)* "You choose who sees each part" / "Tú
  eliges quién ve cada parte", and *(draft)* "Ten parts of your profile, each
  set to Everyone, Followers or Only me. Block anyone, report anything, and
  delete your account or take your data with you whenever you want." /
  "Diez partes de tu perfil, cada una en Todos, Seguidores o Solo yo. Bloquea
  a quien quieras, denuncia lo que haga falta, y borra tu cuenta o llévate tus
  datos cuando quieras." Beside it, three of the app's privacy rows -- Personal
  records, Workout history, Rank / Récords personales, Historial de
  entrenamientos, Rango -- each with its three-way choice, as an
  illustration. **No default is stated**: new accounts start at Followers and
  older ones differ.

**Layout.**
- **Ground:** the page's theme. Each fragment sits on a ruled `--surface`
  panel about 360px tall, built from the app's own components -- not a phone
  frame, so this section reads differently from the phone-led ones.
- **≥ 1024:** three columns, each the eyebrow, title, sentence and panel;
  under them the privacy band across the width, its text left and the three
  rows right.
- **768–1023 and < 768:** each scene stacked (text, then panel), then the
  band with its rows under its text.

**Motion.**
- *Heading:* line rise and rule draw.
- *Desktop:* the scenes play as a sequence, one at a time (§7.3) --
  activity, partners, messages -- about 13 seconds in all, then rest on their
  final states; again when the section re-enters the view. When the band is
  in view, its three rows' markers slide one after another (200ms each, the
  nav-marker slide, §9.1) to different choices, then rest.
- *Below 1024:* each scene plays when it is half in view; the band likewise.
- *Reduced motion and no JavaScript:* final states.

**Assets.** Presentational parts of the activity entry and its reactions
(`SOC-03`/`SOC-04`), the training-partner card and the partner alert
(`SOC-08`/`NOTIF-07`), the conversation thread and its routine card (`MSG-01`/`MSG-07`)
and the privacy rows (`PROF-06`, `ToggleRow`), identified at build.

**Data.** Synthetic and labelled "Example": a member "Lu" with an initials
avatar, a Push day with 3 records, the Upper / Lower routine.

**Accessibility.** Each scene's `h3` and sentence say what its panel shows;
the panels and the band's rows are `aria-hidden` illustrations, never
focusable, so nobody tabs into a control that does nothing.

**Acceptance checks.** Every named reaction, prompt, limit and attachment
kind comes from the app or contracts; no default privacy is claimed; scenes
play one at a time and end within 5 seconds each; Spanish fits each column
at 1024 and the stacked panels at 320; final states without JavaScript.

**Needs from §33.** Illustrative, non-interactive copies of controls (the
privacy rows) on public pages.

### 12.10 Free and Pro — `SitePlans`

*Approved 2026-11-20: Free and Pro side by side; "Try Pro free for 7 days" is
the section's filled action. Copy is draft where marked.*

**Job.** Say what is free, what Pro adds and what it costs, plainly enough
that nobody signs up to a surprise -- §29 and §30's rule applies: what Pro
does, stated plainly, with no countdown, discount, urgency or invented data,
and Pro is not "better", it is more.

**Content and copy** (`site.plans`, with the app's `billing` messages wherever
they already say it).
- Eyebrow PLANS / PLANES; `h2` *(draft)*: "Free to train. Pro to plan further."
  / "Gratis para entrenar. Pro para planificar más lejos."
- **The Free card:** "Free" and "No card needed" / "Sin tarjeta"; the
  always-free list as six lines restating the app's `billing.alwaysFree`
  (logging sets, the rest timer and its alerts; automatic progression,
  warm-ups and the plate calculator; history, records, achievements and
  ranks; strength trends up to 90 days and muscle history up to 4 weeks;
  everything social and messages; data export and account deletion); the
  Free limits that matter (3 routine versions, 3 goals, 1 gym) -- every
  number from contracts' `PLANS.FREE.limits` and `strengthRangeNeedsPro`. The
  action: **"Start free" / "Empezar gratis"**, outline → `/signup`.
- **The Pro card:** "Pro" beside the 16px `Crown` glyph in `--ink-3` (§30.1);
  the price from `PRO_PRICE`, formatted by the language with its currency
  and interval ("ARS 4,999 a month" / "ARS 4.999 por mes"); the trial from
  `SUBSCRIPTION_TRIAL_DAYS` ("First 7 days free, once per account" / "Los
  primeros 7 días gratis, una vez por cuenta"); "Cancel any time; Pro lasts
  until the end of what you paid" (`BILL-04`'s rule) and "Paid with Mercado
  Pago" -- the app's own wording where `/plans` already has it. Then **the four
  outcomes the app uses** (`PRO_OUTCOMES` with `billing.offer.outcomes`):
  Plan ahead · Compare and adjust · See all your history · Make it yours /
  Planifica con anticipación · Compara y ajusta · Mira todo tu historial ·
  Hazlo tuyo, each with its short line. Under them the AI line, which is
  where the **routine draft** is named: "Includes up to 10 routine drafts and
  20 training reviews a month" / "Incluye hasta 10 borradores de rutina y 20
  revisiones de entrenamiento por mes", the numbers from `PLANS.PRO.limits`.
  The action: **"Try Pro free for 7 days" / "Probar Pro 7 días gratis"**, the
  section's one filled control, → `/signup?plan=pro`.
- **Under both:** "See the full comparison" / "Ver la comparación completa" →
  `/pricing`, and one line of links: refunds (`/reembolsos`), the cancellation
  button (`/baja`) and the revocation button (`/arrepentimiento`), named as
  the law names them (`LegalLinks`).
- **Never** mentioned: founding members (§11), any discount, or "most
  popular".

**The Pro hand-off.** `/signup?plan=pro` keeps the intent as the template
hand-off does (§12.8: on the device for a day, and through the callback of
email confirmation and Google sign-in). After sign-up, onboarding runs first
-- a trial is best spent with a routine -- and then `/plans` opens, where
`PlanCheckout` offers the trial. **Nothing charges or starts a subscription by
itself**: the member still presses Subscribe and authorizes on Mercado Pago's
page. A signed-in visitor is sent by the middleware from `/signup?plan=pro`
straight to `/plans`.

**Layout.**
- **Ground:** the page's theme. Two cards on `--surface` with a `--rule`
  border and the small radius, equal in size and treatment -- nothing
  coloured, no shadow, no "featured" lift; Pro is told apart by its name, its
  glyph and its content.
- **≥ 768:** side by side, up to 960px together, centred; their lists align
  row by row from the top.
- **< 768:** stacked, **Free first**, then Pro, so the free promise is read
  before the price.

**Motion.**
- *Heading:* line rise and rule draw.
- *Cards:* when the section is a third in view, the two cards rise 24px and
  fade in, 120ms apart; their lines appear 40ms apart; the price is shown,
  never counted (a counting price would be a performance about money).
- *Reduced motion and no JavaScript:* present at once.

**Assets.** None.

**Data.** Real: `PRO_PRICE`, `SUBSCRIPTION_TRIAL_DAYS`, `PLANS` and
`PRO_OUTCOMES`, never typed; a test renders the section's numbers from
contracts and fails when one disagrees.

**Accessibility.** Each card is a region with its `h3` (Free, Pro); the price
is one readable sentence ("ARS 4,999 a month, first 7 days free"); the glyph
is `aria-hidden`.

**Acceptance checks.** Every number matches contracts; the Free card comes
first on phones; nothing is coloured to rank the plans; the Pro hand-off
reaches `/plans` with the trial offered and charges nothing by itself; a
signed-in visitor goes straight to `/plans`; the legal links reach their
pages; Spanish fits both cards at 320 and 768.

**Needs from §33.** Nothing new: §29 and §30 already govern how Pro is
offered; the site applies them.

### 12.11 Questions — `SiteQuestions` (`id="questions"`)

*Approved 2026-11-20: one list of twelve, in the order people ask; payment
detail stays on `/pricing`. Answers are draft, but every fact in them is the
app's and every number comes from contracts.*

**Job.** Answer what stops a visitor from signing up, honestly -- including
the answers a marketing page usually hides (what the AI receives, what
messages are, what is not medical advice).

**Content and copy** (`site.questions`). `h2` *(draft)*: "Questions" /
"Preguntas"; beside it "Something else? Write to us at <the seller's
contact address>" / "¿Otra cosa? Escríbenos a <…>", the address from
[legal-facts.ts](../lib/legal/legal-facts.ts), never typed.

| # | Question (EN / ES) | What the answer says | Source |
| --- | --- | --- | --- |
| 1 | Is it free? / ¿Es gratis? (`id="free"`) | Yes: logging, progression, history, records, ranks and everything social are free with no card; Pro is optional, its price and trial as §12.10 states them. | `PLANS`, `PRO_PRICE`, `SUBSCRIPTION_TRIAL_DAYS` |
| 2 | Do I need to download anything? / ¿Tengo que descargar algo? (`id="install"`) | No app store: it runs in the browser and installs from it -- on iPhone, Safari's Share › Add to Home Screen; on Android, the browser's Install app; on a computer, the install icon in the address bar. On iPhone, notifications need the installed app. | `NOTIF-02`'s iOS rule |
| 3 | Does it work offline? / ¿Funciona sin conexión? | If the signal drops mid-workout you keep logging, and your sets are sent when it returns, as long as the app stays open; it tells you when changes are waiting. | `TRUST-03` |
| 4 | Is it for beginners? / ¿Sirve si recién empiezo? | Yes: a beginner programme, a first-run recommendation from your days and goals, warm-ups and plate loading worked out for you; it grows with you to blocks and deloads (Pro). | `ROUT-03`, `ONBOARD-01`, `LIVE-13` |
| 5 | Which languages? / ¿En qué idiomas está? | English and Spanish, switchable at any time. | `I18N-01` |
| 6 | What does Pro add? / ¿Qué agrega Pro? | The four outcomes and the AI line of §12.10, and a link to `/pricing`. | `PRO_OUTCOMES`, `PLANS` |
| 7 | How do I cancel? / ¿Cómo cancelo? | From Settings › Account, or with the cancellation button (`/baja`) without signing in; Pro lasts until the end of what you paid and nothing is deleted. Within 10 days of buying, the revocation button (`/arrepentimiento`). | `BILL-04`, `BILL-07`, `REVOCATION_WINDOW_DAYS` |
| 8 | Who sees my profile and my workouts? / ¿Quién ve mi perfil y mis entrenamientos? | You choose, for each of ten parts of your profile: everyone, followers, or only you. You can block anyone and report anything. No default is stated. | `PROF-06`, `PROF-10` |
| 9 | Are messages private? / ¿Los mensajes son privados? | They are one to one and stored on our servers; they are **not end-to-end encrypted**. A moderator reads a message only if it is reported, and then only that message and up to five before it, as the person who reported it saw them. | `MSG-01`, `MSG-09` |
| 10 | What happens to what I give the AI? / ¿Qué pasa con lo que le doy a la IA? | Only for Pro's routine drafts and training reviews: what you write or the workouts you choose are sent to Anthropic to write the answer and are not stored by us -- we keep only that a request was made, to count the month. Answers describe, they don't diagnose. | `INTEL-03`, `INTEL-04`, the app's own disclosure lines |
| 11 | Can I take my data or delete my account? / ¿Puedo llevarme mis datos o borrar mi cuenta? | Yes: download everything as one file from Settings at any time, and deleting the account is immediate and complete. | `EXPORT-01`, `TRUST-01` |
| 12 | Is this medical advice? / ¿Esto es consejo médico? | No. Sunnsteel records and describes your training; for pain, injury or health questions, see a professional. | the app's AI disclaimers and the terms |

Each answer links where it points (Settings is described, not linked, to a
signed-out visitor; `/pricing`, `/baja`, `/arrepentimiento`,
`/reembolsos`, `/privacidad` are links).

**Layout.**
- **≥ 1024:** two columns: the `h2` and the contact line in columns 1–4,
  sticky while the list scrolls; the accordion in columns 5–12.
- **Below 1024:** the heading, the contact line, then the list.
- The accordion is the app's `Accordion` (`type="multiple"`, ruled rows,
  §30.2), each question a `type-panel` trigger with its chevron.

**Motion.**
- *Heading:* line rise and rule draw.
- *Entry:* the rows appear 40ms apart (opacity and a 6px rise) the first time
  the list is in view.
- *Opening:* as in the app (motion spec §2.7): the height changes at once, the
  answer fades in over `--motion-fast` and the chevron turns over
  `--motion-base`. No height animation (§1.2 of the motion spec).
- *Reduced motion and no JavaScript:* present at once; without JavaScript
  every answer is open.

**Data and SEO.** The questions and answers are also `FAQPage` JSON-LD,
generated from the same messages in the page's language, so the two can
never differ.

**Accessibility.** Radix's accordion semantics; each question is a heading
holding its button; links in answers are real links; an anchor (`#install`,
`#free`) opens its question when the page loads on it.

**Acceptance checks.** Every number matches contracts and every fact matches
the app (a reviewer checks each against its source column before the copy
deck is approved); `/#install` and `/#free` open their questions; the JSON-LD
matches the visible text; answers fit at 320 in Spanish.

**Needs from §33.** Nothing new.

### 12.12 Closing band — `SiteClosing`

*Approved 2026-11-21: a second generated clip behind it on desktop (its
poster on phones), the headline "Start forging yourself.", and a QR card on
desktop.*

**Job.** The last push before the footer: the belief restated, the primary
action once more, and -- for a visitor on a computer -- a way to carry the
site to the phone they will train with.

**Content and copy** (`site.closing`).
- `h2`: "Start forging yourself." / "Empieza a forjarte." -- the hero's
  headline closed into a circle.
- Subline *(draft)*: "Free to start, in your browser, in English or Spanish."
  / "Gratis para empezar, en tu navegador, en español o inglés."
- **"Create a free account" / "Crear cuenta gratis"** (filled) → `/signup`;
  **"Sign in" / "Iniciar sesión"** (ghost) → `/login`; under them "How to
  install" / "Cómo instalarla" → `/#install`.
- **The QR card** (from 1024 only): "Open it on your phone" / "Ábrelo en tu
  teléfono", the code, "Scan it with your camera" / "Escanéalo con la cámara"
  and the address written out beneath it.
- The video's pause control, as in the hero.

**What the QR does.** It opens the site on the phone; **no page can install
itself** -- every browser requires the visitor's own tap. The code points at
`<PUBLIC_ORIGIN>/?install=1`, and a phone arriving there sees an **install
helper** at the top of the landing (the `#install` answer, opened, plus one
action):
- where the browser offers installation (Chrome, Edge and Samsung Internet on
  Android fire `beforeinstallprompt`), a one-tap **"Install Sunnsteel" /
  "Instalar Sunnsteel"** that opens the browser's own install dialog;
- on iPhone and iPad, where Safari offers no such event, the two steps --
  Share › Add to Home Screen -- drawn as two small steps, with the note that
  notifications need the installed app;
- an already installed app (`display-mode: standalone`) or a computer shows
  no helper.
The app has no install prompt today; this one is the site's alone (the app
could adopt it later, outside `SITE-01`). The code is generated at build as an
SVG (no runtime library), in `--foreground` on `--surface`, with the quiet zone
the format needs.

**Layout.**
- **Ground:** a Night region in both themes over the video and its scrim, as
  the hero.
- **≥ 1024:** the `h2`, subline and actions left in columns 1–7; the QR card
  right in columns 9–12, a ruled `--surface` card with the small radius.
- **Below 1024:** centred text and actions, no QR card.

**Motion.**
- *Desktop:* when the band is a third in view, the `h2` rises line by line
  and its rule draws, the actions rise 8px, the QR card rises 24px and fades
  in; the clip crossfades in over its poster once it can play, and while the
  band scrolls into place the video settles from a 1.04 scale to 1 -- the
  hero's movement in reverse, closing the page.
- *Phone:* the text sequence over the poster.
- *Reduced motion, `Save-Data` and no JavaScript:* the poster, everything
  present.

**Assets.**
- **The second clip** (desktop only): close-ups -- chalk on hands, plates
  sliding onto a bar, a collar tightened, a bar set down -- in the hero's
  grade, a seamless 8–12 s loop, no audio, at most 2 MB, requested only when
  the band is within one screen; same generation brief and gate as §7.2.
- **Posters:** desktop and phone, AVIF and WebP, at most 120 KB and 60 KB.
- **The QR code**, generated at build per environment's `PUBLIC_ORIGIN`.

**Data.** None.

**Accessibility.** The video is `aria-hidden`, with its pause control; the QR
image's alternative text is the address it opens, also printed under it; the
install helper's button is the browser's own dialog, and the iPhone steps are
text with icons.

**Acceptance checks.** The clip is never requested on phones, under reduced
motion or `Save-Data`, nor before the band approaches; the code opens
`/?install=1` on the environment's own origin; on Android Chrome the helper's
button opens the install dialog; on iPhone Safari the steps show; an
installed app sees no helper.

**Needs from §33.** A second video region; the install helper.

### 12.13 Footer — `SiteFooter`

*Approved 2026-11-21: no seller identification in the footer.*

**Job.** Every public page's way out: the site map, help, the legal pages,
and the two buttons Argentina's consumer law asks for on every signed-out
surface (`BILL-07`).

**Content and copy** (`site.footer`).
- The lockup and the hero's headline in small.
- **Product / Producto:** All features, the six feature pages, Pricing.
- **Use cases / Casos de uso:** Beginners, Intermediates, Advanced lifters.
- **Help / Ayuda:** Questions (`/#questions`), Install the app
  (`/#install`), Contact -- the support address from `legal-facts.ts`.
- **Legal:** Terms (`/terminos`), Privacy (`/privacidad`), Refunds
  (`/reembolsos`).
- **The bottom row:** `LegalLinks` -- the *botón de arrepentimiento* and the
  *botón de baja*, named as the law names them in either language -- the
  language switch, and "© <year> Sunnsteel".
- **No seller identification** here (the owner's decision). What the legal
  pages themselves show is a separate decision, outside `SITE-01`.

**Layout.** The page's theme with a `--rule` above. From 1024, the lockup
then four columns; 768–1023, two by two; below 768, the columns stacked with
the bottom row last. Link targets at least 44px tall on touch.

**Motion.** None: chrome does not perform.

**Accessibility.** A `<footer>` with a `<nav aria-label>` ("Footer" / "Pie de
página"); column titles are labels, not headings that break the outline.

**Acceptance checks.** The two legal buttons are on every public page; every
link resolves; the language switch reloads on the same page.

**Needs from §33.** Nothing new.

---

The public pages of §4.1 follow. *Approved 2026-11-21: four templates and an
outline per page, written in one pass; feature pages are a guide under an
animated header; a signed-in visitor to `/pricing` goes to `/plans`.* Their
copy is draft throughout and is written in the phase 1 copy deck; what is
fixed here is each page's structure, its proof, its animation and the
sources its facts come from.

### 12.14 What every public page shares

- **Chrome:** the top bar (§12.1, over a Night header it starts transparent
  as on the landing), the footer (§12.13), and a **compact closing band** --
  §12.12's `h2` and actions on the Night ground, without video or QR -- before
  the footer.
- **Above the `h1`:** a breadcrumb (Features › Workout tracker), and under the
  subline an "Updated <month year>" line from a per-page constant changed with
  the page's content.
- **Every rule of §5–§7 and §12.0**: the Pro tags from contracts, numbers never
  typed, synthetic data labelled, both languages written together.
- **Motion:** each page's header is the cinematic part (its own animated
  mock-up, the load sequence of §12.2 and the scroll drift); below it, a
  section's heading rises and its rule draws, and its blocks rise 12px and
  fade in once per visit. Reduced motion and no JavaScript: present at once.
- **SEO:** per-language title and description (drafts below), canonical URL,
  `BreadcrumbList` and `FAQPage` JSON-LD generated from the visible text, an
  OG image per page generated like the landing's, every page in
  `sitemap.xml`.
- **Worked examples are computed, never typed**: where a page shows a table
  of numbers, it is produced at build by the same pure rule the app or the
  server uses (contracts, or the restated backend rule with its test, §12.5),
  so the page cannot show something the product would not do.

### 12.15 Template — a feature page (`/features/<slug>`)

1. **Header** (Night ground, both themes): breadcrumb, the plan tag (Free,
   Free + Pro, or Pro), the `h1` in a smaller display rank than the landing's,
   the subline, the updated line; "Start free" (filled) → `/signup` and "See
   pricing" (ghost) → `/pricing`. Right, from 1024: the feature's animated
   phone, reusing its landing script (each page names it below); below 1024,
   under the text. The phone drifts against the scroll as on the hero.
2. **Overview:** a paragraph of what it is, three highlight cards, and a
   facts grid (each fact from code: limits, plan, counts).
3. **How it works:** three to five numbered steps.
4. **Worked example:** a computed table (see each page).
5. **What it covers:** a ruled table of what is free, what is Pro and the
   limits.
6. **Tips:** three to five lines.
7. **Related:** two other features and the use case where it matters most.
8. **Questions:** four to six, with JSON-LD.
9. Compact closing band.

### 12.16 The six feature pages

| Page | Plan | Header script | Worked example (computed from) | Questions include |
| --- | --- | --- | --- | --- |
| **Workout tracker** `/features/workout-tracker` -- *h1 draft:* "Log every set in seconds" / "Registra cada serie en segundos" | Free | The hero's live session (§12.2): a set ticked, rest, a record | The warm-up ramp for a 100 kg working load and the plates per side, from contracts' warm-up and plate rules (`LIVE-13`/`LIVE-20`) | Does the rest alert work with the screen locked (installed app, notifications on)? What if the signal drops (§12.11, 3)? Can I add an exercise mid-workout (no -- swap one or add extra sets, the routine is the plan)? Can I fix a finished workout (the latest, for 48 hours, `SESSION_CORRECTION_WINDOW_HOURS`)? |
| **Routine builder** `/features/routine-builder` (anchor `#draft`) -- "Build the routine you'll actually follow" / "Arma la rutina que vas a seguir" | Free + Pro | The Plan verb's script (§12.4) | The quality summary of Upper / Lower: weekly sets per muscle from `plannedMuscleSets` over the template | What is a rotation? Can I share or copy routines? Versions (3 Free, 20 Pro)? What does the draft send (§12.11, 10), and its 10 a month on Pro? |
| **Automatic progression** `/features/progression` -- "The weight goes up when you earn it" / "El peso sube cuando te lo ganas" | Free + Pro | The progression ledger (§12.5) | A: the double-progression ledger (backend rule, tested); B: an 8-week block at a 100 kg reference max, step by step, from contracts' `LP_STEPS` (Pro) | What if I miss my reps (the weight lifted carries over)? Can I switch it off for one exercise? What step does it use? Does a deload move my loads (no)? |
| **Progress** `/features/progress` -- "Progress you can read" / "Un progreso que se puede leer" | Free + Pro | The body-map weeks (§12.6), in a phone | How one session lands on the body map: Bench Press 3 sets → chest 3, triceps 1.5, front shoulders 1.5, the weighting the app uses (primary 1.0, secondary 0.5) from the catalog | What is estimated 1RM (the app's own definition)? Why do bodyweight sets add no volume? Do signals tell me what is wrong (no: numbers, never causes)? What is Pro here (longer history, measurements, signals, comparisons, review)? |
| **Ranks and achievements** `/features/ranks` -- "Earned by showing up" / "Se gana apareciendo" | Free | The Artisan crest and its header (§12.7) | The six ranks and the 25 milestones by category, from contracts' `RENAISSANCE_RANK_DEFINITIONS` and milestone thresholds | How is a rank earned (sessions and distinct weeks)? What is a comeback (14 days away, then 3 active days within 14)? Who sees my rank (you choose)? Are records found automatically (yes, from your sets)? |
| **Training with people** `/features/community` -- "Train with people, on your terms" / "Entrena con otros, a tu manera" | Free | The messages scene (§12.9), in a phone | The ten privacy parts and what each controls, from the app's privacy messages | Are messages end-to-end encrypted (no, §12.11, 9)? Who can message me (people I follow, everyone or nobody)? Can I share a workout with someone without an account (a revocable link)? How do blocks and reports work? |

**Not claimed** on any page: that a rank can never be lost (nothing in the
code says so yet), any formula the page cannot compute from the app's own
code, or any count of members.

### 12.17 Template — a use-case page (`/use-cases/<level>`)

1. **Header** (Night): eyebrow "FOR BEGINNERS · FREE" / "PARA PRINCIPIANTES ·
   GRATIS" (the plan from the page's main tools), the `h1`, the subline, the
   audience line; "Start with <template>" (filled) →
   `/signup?template=<slug>` (§12.8's hand-off) or, for advanced, "Start
   free"; "See every feature" (ghost). Right, from 1024: the level's
   template card from §12.8, its week lighting day by day.
2. **Facts band** -- true facts about the programme, never usage numbers:
   beginners "3 days a week · full body · free"; intermediates "4 to 6 days ·
   upper/lower or push/pull/legs · free"; advanced "8-week blocks · planned
   deloads · Pro".
3. **What changes at this level:** four numbered cards.
4. **The programme:** the level's template card(s), or for advanced the
   builder with the 8-week block and deloads (Pro tags).
5. **Tools for this level:** four cards linking feature pages, tagged.
6. **Step by step:** five or six numbered steps from sign-up to the next
   level.
7. **Next level:** a card to the next use case (advanced links back to the
   features).
8. **Questions** with JSON-LD; compact closing band.

### 12.18 The three use-case pages

| Page | `h1` *(draft)* | What changes (four cards, *draft*) | Tools | Step by step ends at |
| --- | --- | --- | --- | --- |
| **Beginners** `/use-cases/beginners` | Start lifting with a plan / Empieza a entrenar con un plan | Learn a few movements well; your first loads are yours to find; add weight when every set reaches the top of its range; show up most weeks | Workout tracker (warm-ups, plates), automatic progression, ranks, the template | Moving to the intermediates' page when the full-body sessions stop progressing for several weeks (plateau watch says when) |
| **Intermediates** `/use-cases/intermediates` | Keep progressing past the first months / Sigue progresando después de los primeros meses | Progress slows; splitting the body lets each muscle get more weekly sets; weekly sets per muscle become the measure; plateaus are read, not guessed | Body map and weekly sets, plateau watch, routine versions, supersets | Trying an 8-week block (Pro) |
| **Advanced** `/use-cases/advanced` | Plan blocks, deloads and the long game / Planifica bloques, descargas y el largo plazo | Training runs in blocks; deloads are planned, not improvised; blocks are compared with what came before; signals are read over weeks | 8-week blocks, dated training blocks, planned deloads, signals and comparison, the training review (all Pro) | Back to the features overview |

"What changes" is general training sense, written plainly and checked in the
copy deck: no medical claims, no promised results, nothing a member's own
numbers could contradict.

### 12.19 The features overview (`/features`)

1. **Header** (Night, lighter: no phone): "Everything Sunnsteel does" / "Todo
   lo que hace Sunnsteel" *(draft)*, subline, the two actions, and a facts band
   of true facts (free to start; 80+ exercises; English and Spanish; in your
   browser).
2. **The six feature cards**, grouped under the four verbs (Plan: routine
   builder, progression; Train: workout tracker; Measure: progress; Earn:
   ranks; and training with people), each a name, one line, its plan tags and
   a link; each card's small mock-up makes one move as it enters.
3. **At a glance:** one ruled table of every capability by verb, Free or Pro,
   generated from the rows `/plans` renders (`plans.ts`) and the always-free
   list -- the site's master list, and the honest answer to "what is free".
4. A Free-and-Pro line linking `/pricing`; questions; compact closing band.

### 12.20 Pricing (`/pricing`)

- **A signed-in visitor is redirected to `/plans`** by the middleware (the
  owner's decision), which already shows their plan, the purchase and the
  comparison; a test sits beside the other redirect tests.
- **Header** (Night): eyebrow "PRO · 7 DAYS FREE" / "PRO · 7 DÍAS GRATIS"
  (trial from contracts), the `h1` *(draft)* "Free to train. Pro to plan
  further.", the subline; "Try Pro free for 7 days" (filled) →
  `/signup?plan=pro` (§12.10's hand-off) and "Start free" (ghost). A facts band:
  the price, the trial and "Cancel any time", from contracts, never counted.
- **What Pro adds:** the four outcomes with their full descriptions
  (`billing.offer.outcomes`) and the AI line (§12.10).
- **The comparison:** the same table `/plans` renders (`plans.ts`, §29.4),
  read-only, nothing coloured; then what is always free.
- **Who it is for** *(draft)*: three short profiles -- planning blocks and
  deloads; wanting the long history and comparisons; wanting drafts and
  reviews.
- **Questions:** the app's own `billing.plans.faq` (cancelling, the trial,
  refunds, how the charge is made, leaving Pro), with `id="free"` and
  `id="pro"` anchors that the menu links to, and the legal links line.
- **Motion:** the header's load sequence and the section reveals; nothing
  about the price moves.

### 12.21 Titles and descriptions (drafts)

| Page | Title (EN / ES) |
| --- | --- |
| `/` | Sunnsteel — Forge yourself. Prove it in every set. / Sunnsteel — Fórjate. Demuéstralo en cada serie. |
| `/features` | Features — Sunnsteel / Funciones — Sunnsteel |
| `/features/<slug>` | <Feature> — Sunnsteel / <Función> — Sunnsteel |
| `/use-cases/<level>` | Sunnsteel for <level> / Sunnsteel para <nivel> |
| `/pricing` | Pricing — Free and Pro — Sunnsteel / Precios — Free y Pro — Sunnsteel |

Each description is the page's subline, at most 155 characters, written in
the copy deck.

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
