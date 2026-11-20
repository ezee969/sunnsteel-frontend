# SITE-01 — The public landing page: plan

Status: **plan, not started** (roadmap [`SITE-01`](roadmaps/product-roadmap.md#public-site)).
Written 2026-11-20 at the owner's request. It is the brief the build starts
from; every decision marked **Owner** is asked at claim, before any comp is
drawn.

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
beside it; a signed-in visitor still goes straight to `/dashboard`.
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

1. **Top bar** — lockup (`SunnsteelMark` + wordmark, §18), anchors (Features,
   Pro, Questions), language switch (sets `ss-locale`, as Settings does),
   **Sign in** (ghost) and **Start free** (filled). Collapses to the lockup,
   Sign in and a menu below `md`.
2. **Hero** — headline, one-sentence subline, the two actions, the install
   line, and the hero visual (§7.2). Must make the offer intelligible in the
   first viewport at 390×844 without scrolling.
3. **Proof line** — true facts only (§6.2).
4. **The four verbs** — *Plan* (routine builder, templates, blocks), *Train*
   (live session: rest timer, plate calculator, set kinds, supersets),
   *Measure* (strength trends, muscle distribution, body progress, training
   signals), *Earn* (records, milestones, ranks). Each: a heading, two lines,
   a real screenshot in an original phone frame, and one detail callout.
5. **The workout, demonstrated** — the page's signature section: a small,
   self-running and touchable demo of the live session built from the app's
   own primitives with labelled synthetic data — tick a set, the set-completion
   signature plays, the rest bar counts, a record is crossed and celebrated.
   Proves the product instead of describing it.
6. **Progress you can read** — the strength chart and the muscle map
   (`PROG-15`, if shipped; otherwise the `PROG-03` matrix), with real-looking
   synthetic data, labelled.
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
    links to the legal pages. The founding-member offer only if the owner
    wants it public.
11. **Questions** — an accordion: is it free, do I need to install it, does it
    work offline, Spanish/English, what Pro adds, how to cancel (`/baja`),
    data export and deletion.
12. **Closing band** — the belief restated and the primary action once more.
13. **Footer** — `LegalLinks` (botón de arrepentimiento and botón de baja are
    legally required on every signed-out surface, `BILL-07`), terms, privacy,
    refunds, language, contact.

## 5. Architecture and routing

- **Route:** a new route group `app/[locale]/(site)/` with its own lean layout
  (no protected shell, no notification or realtime providers). The page is a
  **Server Component, fully static per language** — no TanStack Query, no
  Supabase read on render. Interactive islands (the demo, the menu, the
  accordion, the language switch) are small client components.
- **Middleware:** the `/` branch changes from "redirect to `/login` when
  signed out" to "rewrite to the landing when signed out"; signed in still
  redirects to `/dashboard`. `middleware.test.ts` gains both cases.
- **Language:** the address carries no locale (I18N-01), so crawlers see the
  language chosen by `Accept-Language`. **Owner:** which language a crawler
  without one gets (Spanish recommended for the Argentine market). Copy lives
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
  (landing → signup → first workout) needs a measurement. **Owner:** Vercel Web
  Analytics (cookieless, no consent banner) or nothing for now.
- **Performance budget** (mid-range Android, 4G, cold): LCP ≤ 2.0 s, CLS ≤
  0.05, INP ≤ 200 ms, landing JS ≤ 90 KB gzip beyond the framework, hero image
  ≤ 150 KB AVIF with WebP fallback, fonts already self-hosted and preloaded, no
  video in the first viewport on phones. Lighthouse ≥ 95 in all four
  categories on phone and desktop.

## 6. Content rules

### 6.1 Voice
The app's voice (design system §23.4, [i18n.md](reference/i18n.md)): plain,
exact, no hype words, sentence case except region labels; Spanish neutral
Latin American with *tú* and the glossary's words. Headlines may be shorter
and bolder than app copy, never less true.

### 6.2 Honesty (non-negotiable)
- **No invented number, rating, testimonial, logo wall or user count.** A
  counter appears only if it is real, read from production, above a threshold
  the owner sets, and refreshed at build or revalidated — **Owner** decides if
  any appears at launch.
- Allowed true facts today: free to start; works in the browser and installs
  on any phone; works offline with changes saved on reconnect; English and
  Spanish; your data exportable and deletable; private by default.
- Every screenshot or demo with data is **synthetic and labelled** as an
  example. No real member's name, face, record or message appears.
- Generated people (if the chosen direction uses any) are clearly
  illustrative, never presented as members or results.

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
  stays "exceeded expectation" (a record in the demo, a reached rank), never
  decoration. Richness comes from material and imagery, not new hues.
- **Motion** (the third motion amendment): §9.2 forbids page entrances and
  per-section fade-ups; the landing keeps that ban. Motion is allowed only as
  **demonstration of the product's own signatures**: the rule draw on section
  headings, set completion in the demo, the crest draw (§24.4), and the rest
  bar. Optional scroll-linked behaviour (for example the phone frames
  advancing a screenshot as the verbs scroll) is decided with the comp, uses
  transform/opacity only, and is off under both reduced-motion sources.
- **Device frames:** original, drawn as SVG to the brand's line language — not
  Apple's or Google's frames.

### 7.2 Hero visual — three candidate directions for the comp round
The `impeccable` direction round (§8, phase 2) decides; these are the
starting material, all inside the system:

1. **Sculpted presence** — the `final-4a` "presencia" bust from
   `branding-explorations/2026-10-01/` (stone/steel, raking light) beside the
   headline, with the live-session phone overlapping it. Strongest brand
   continuity.
2. **The ledger** — no figure: a large, slowly self-filling training ledger
   (sets ticking, a record crossing in gold) as the hero itself. Most
   product-honest, lightest to load.
3. **Monument in progress** — a generated architectural image of a column or
   arch under construction, scaffolding giving way to marble, paired with the
   rank ladder: "building a monument" made literal.

## 8. Skills, tools and agents — the production workflow

Each phase ends in an owner approval before the next starts.

### Phase 0 — Brief and context
- **`impeccable init`** — writes `PRODUCT.md` and the landing's surface brief
  (mode *Persuade*) from this plan, [PRODUCT_VISION.md](../../PRODUCT_VISION.md)
  and [FEATURES.md](../../FEATURES.md). It must **point to
  `ui-design-system.md` as the visual authority** rather than generate a
  competing `DESIGN.md` (the `sunnsteel-design` rule); any `DESIGN.md`
  impeccable needs is a pointer file.
- **`AskUserQuestion`** at claim for every **Owner** item in §11.

### Phase 1 — Shape (structure and copy, no visuals)
- **`impeccable shape landing`** — the section order, each section's job, the
  proof each one uses, the states (narrow, wide, Spanish, reduced motion).
- **`impeccable clarify`** — headline, subline and every section's copy, in
  English and Spanish together; checked against the glossary.
- Deliverable: a copy deck in both languages, approved by the owner.

### Phase 2 — Direction and comps (the UI decision)
- **`impeccable` new-work flow** (`concept-seed --scope direction --mode
  persuade`) over the three directions in §7.2, constrained by the design
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
  images.
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
- **`impeccable animate`** — implements §33's motion with CSS and the
  already-installed `framer-motion` (no new animation library; Lottie, GSAP and
  video heroes are declined unless the amendment says otherwise).

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
   language; a signed-in one opens the dashboard; no other route changed.
2. The first viewport at 390×844 states the offer and shows both actions.
3. Every claim on the page is true on launch day; every data image is
   labelled synthetic; prices come from contracts.
4. Both languages, both themes, all seven sweep widths pass; no text truncated
   in Spanish.
5. §5's performance budget and Lighthouse ≥ 95 are met and recorded.
6. Amendment §33 is in the design system, approved, and the page follows it.
7. Legal buttons and pages are reachable from the footer.

## 10. Risks

- **Marketing drift into the app** — mitigated by the route group's own layout
  and §33 applying only to `(site)`.
- **Generated imagery that looks generic or uncanny** — the comp round and
  the owner's approval gate it; direction 2 (the ledger) needs no generated
  figure at all.
- **Stale screenshots** — mitigated by capturing them from the portfolio
  pipeline, re-run when a pictured screen changes.
- **SEO limits of a locale-less address** — accepted for now; a `/es`,
  `/en` public prefix is a separate decision if search traffic matters.
- **Weight** — imagery and demo must fit §5; anything that does not is cut,
  not compressed until it looks bad.

## 11. Decisions for the owner at claim

1. Headline and positioning line (phase 1 proposes three).
2. Hero direction (§7.2: presence, ledger or monument) — decided on comps.
3. Generated people: allowed, or no human figures at all.
4. Any real counter on the page at launch, and its threshold.
5. The crawler's default language.
6. Analytics: Vercel Web Analytics or none.
7. Whether the founding-member offer is mentioned publicly.
8. Whether `PROG-15` (muscle map) should ship first so the landing can show it.
