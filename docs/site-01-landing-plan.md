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

1. **Top bar** — lockup (`SunnsteelMark` + wordmark, §18), links to Features
   (`/features`) and Pricing (`/pricing`), an anchor to Questions, language switch (sets `ss-locale`, as Settings does),
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
5. **The workout, in motion** — an animated mock-up of the live session in a
   phone frame (§7.3) that plays by itself when it comes into view: a set
   ticked, the rest bar counting, a record crossed in gold, with labelled
   synthetic data. Not interactive (the owner's decision).
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
feature** and **by use case, divided by experience**. The top bar carries a
menu for each, plus Pricing.

- **`/features`** — every feature at a glance, each linking to its own page.
- **One page per feature**, `/features/<slug>` (slugs fixed in §12): the
  workout tracker (live session, rest timer, plates, warm-ups, set kinds,
  supersets), the routine builder (templates, rotations, versions), automatic
  progression (double progression, the 8-week block), progress (strength,
  the body map, body progress, training signals), ranks and achievements, and
  training with people (follows, partners, messages, privacy).
- **Use cases by experience**, `/use-cases/<level>` (slugs fixed in §12), each
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
  production**: the production build fails while any placeholder remains, and
  before launch each becomes a real number read from production (above a
  threshold the owner sets) or is removed -- decided then.
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
- **Placeholder figures shipped by mistake** — the production build refuses
  them (§6.2).
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

Taken by default, not asked: the headline and positioning line (phase 1
proposes three); the body map on Progress, since `PROG-15` shipped the same
day.

## 12. Section-by-section specification

To be written with the owner, one section at a time, before the build: for
each section of §4 and each page of §4.1, its job, copy in English and
Spanish, layout at 390 and 1440, its motion (desktop and phone), its assets
and its data.

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
