# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Members:** people who lift, or want to start, logging their training on
  the phone they carry into the gym; the app is a PWA installed from the
  browser. It ships in English and Spanish, and Argentina is where Pro is
  sold (Mercado Pago, prices in ARS).
- **Public-site visitors** (`SITE-01`, the owner's answer of 2026-11-21): a
  varied audience, in English first, arriving from a shared profile or
  workout, a search or word of mouth, deciding whether to create a free
  account.

## Product Purpose

A workout tracker that makes training consequential: plan a routine, log
every set, and watch records, ranks and a history accumulate from what was
actually done. Success is a member who keeps showing up, with a record of it
that nobody can fake.

## Positioning

- **Every set becomes evidence.** Records are detected from logged sets;
  ranks are earned by attendance (workouts in distinct weeks), never by
  posting.
- **Numbers, never verdicts.** Every analysis states its numbers and its
  rule, and never names a cause, gives medical advice or invents a figure;
  the AI features describe the member's own logs and cite every number.
- **Classical humanism × measurable training**: "Build yourself. Prove it
  through action." ([PRODUCT_VISION.md](../PRODUCT_VISION.md)).

## Operating Context

- Mid-workout, one-handed, in a gym with patchy signal: logging keeps working
  when the connection drops and sends the changes when it returns, while the
  app stays open.
- Installed from the browser to the home screen (no app store); on iPhone,
  notifications need the installed app.
- Social is opt-in and private-first in spirit: each of ten profile parts has
  its own audience, members can block and report, and direct messages are
  stored on the server (not end-to-end encrypted).

## Capabilities and Constraints

- Routines weekly or as a rotation, three starter templates (Full Body
  Foundations, Upper / Lower, Push / Pull / Legs), routine versions,
  supersets and circuits, set kinds, warm-up ramps and a plate calculator,
  automatic double progression, exercise swaps mid-workout, an 80-exercise
  catalog plus a member's own exercises.
- Progress: strength trends by estimated 1RM, a body map of weekly sets per
  muscle, body weight and measurements, plateau watch, records timeline.
- Earn: six ranks (Initiate to Laureate) and 25 milestones; rank decoration
  on the profile.
- People: follows and activity with reactions and comments, training
  partners, direct messages carrying routines,
  workouts, records, milestones, comebacks and months.
- **Free and Pro** are decided by contracts' `PLANS` (never typed): Pro adds
  8-week blocks, dated training blocks, planned deloads, training signals and
  the deload suggestion, comparisons, longer history, body measurements
  beyond weight, goal suggestions, routine drafts and the training review
  (both AI, by Anthropic's Claude). Pro is ARS 4,999 a month with a 7-day
  trial once per account, paid through Mercado Pago, cancellable at any time.
- **Open decision:** an international English-speaking audience may not be
  able to pay in ARS through Mercado Pago Argentina; how Pro is offered to it
  is undecided.
- Terminology and voice in both languages: [docs/reference/i18n.md](docs/reference/i18n.md)
  (Spanish neutral Latin American with *tú*).

## Brand Commitments

- The name **Sunnsteel** and its lockup and mark.
- **The visual system is [docs/ui-design-system.md](docs/ui-design-system.md)
  and [docs/ui-motion-spec.md](docs/ui-motion-spec.md)**, binding; the public
  site's departures from it live only in its amendment §33 (a draft until
  approved). No other document is visual authority, and any DESIGN.md this
  project carries points there.
- Voice: plain, exact, no hype words; headlines may be bolder than app copy,
  never less true.
- Every capability Pro unlocks is labelled Pro where it is named.

## Evidence on Hand

- **No real evidence exists** (the owner, 2026-11-21): no testimonials,
  reviews, ratings, press, customer logos, member photos or real usage
  figures. Everything the site shows is mock-up: synthetic data labelled
  "Example", background footage of real models from licensed stock (Mixkit,
  never presented as members), and placeholder usage figures that a
  production build replaces with true product facts.
- Real product screenshots, captured from a seeded account:
  `docs/portfolio/screenshots/` (34 frames).
- The owner's 2026-10-01 brand explorations (bust, stone and steel) are
  local, in `../branding-explorations/2026-10-01/`.
- Never fabricate: member counts, ratings, testimonials, results, prices or
  capabilities the product does not have.

## Product Principles

1. Reward what people do, not what they post.
2. State the numbers and the rule; never a cause, a diagnosis or a promise.
3. Free covers training itself; Pro adds planning depth and longer views,
   and is offered plainly, never with urgency.
4. One honest source per fact: prices, limits and catalog data come from the
   code that enforces them.
5. Both languages are first-class; nothing ships in one only.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast in both themes and under the higher-contrast
preference, two reduced-motion sources (the OS and the app's own setting),
44px touch targets, 16px inputs on phones, keyboard paths with visible focus,
nothing carried by colour alone, and English and Spanish written together.
