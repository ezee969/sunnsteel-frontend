---
version: 1
slug: "app-locale-site-page-tsx"
primary_target: "app/[locale]/(site)/page.tsx"
related_targets: ["app/[locale]/(site)/features/page.tsx","app/[locale]/(site)/pricing/page.tsx"]
---

# Surface brief — the public site (SITE-01)

**Scope:** the `(site)` route group — `/` for a signed-out visitor, `/features`
and six feature pages, three `/use-cases` pages, `/pricing`. The specification,
section by section, is `docs/site-01-landing-plan.md` §12; this brief only
keeps what later agents need to reload.

**Visitor mode:** Persuade (the app behind it stays Operate).

**Audience and job:** a varied, English-first audience (Spanish written
alongside) deciding whether Sunnsteel is worth a free account; arriving from
a share, a search or word of mouth, often on a phone.

**Action:** create a free account (primary); sign in; install from the
browser; try Pro for 7 days (on the plans band and `/pricing`).

**Belief to earn:** every set logged becomes evidence — records, ranks and a
history nobody can fake — read back as numbers, never verdicts.

**Proof and content:** the app's own screens as animated mock-ups with
synthetic, labelled data; real product facts from code (templates, ranks,
milestones, catalog size, plan limits, price); a background video of real
models training on machines, from licensed stock (Mixkit; the plan's §7.2
shortlist), graded black and white. No real testimonials, ratings, counts
or member imagery exist; usage figures are placeholders replaced by true
facts in production.

**Constraints:** the design system (`docs/ui-design-system.md`) and its §33 for
the site (in force since 2026-11-21); both languages; WCAG 2.2 AA; the performance budget of the
plan's §5; Pro tagged wherever named; build path comp-first.

**Approved comp (2026-11-21):** `.impeccable/mocks/comp-a-full-bleed.png` -- the video full-bleed behind the hero, text over its dark left side, the live-session phone on the lower right standing on the proof band. Its composition is the contract; its AI-generated imagery is not (the owner wants real people; see the plan §11).

**Footage (2026-11-21):** Mixkit's free-licence gym-with-machines series, led by the man, no chest-press or shoulder-press shots (plan §7.2, §11 row 39).

**Approved comp over the real footage (2026-11-21):** `.impeccable/mocks/comp-a-real-1536.png`, with `comp-a-real-390-en.png` and `comp-a-real-390-es.png` for phones -- comp A's composition redrawn over the approved poster frames with the owner's brand line (source `.impeccable/mocks/src/comp-a-real.html`). The 1536 frame is the comp the build is measured against.

## Direction contract

THESIS: every set becomes evidence. The ground is real, serious training; the proof is the product's own ledger ticking a set and logging a record. It refuses the category hero: no gradient, no feature-icon row, no smiling testimonial, no store badges.

OWN-WORLD: the Night ground in both themes for hero and proof band; black-and-white footage on machines under one flat scrim (0.64, measured to 4.5:1 on the brightest frame); Cinzel 600 capitals for the one inscription, Oswald labels and the filled button, Source Sans 3 lead, Bebas Neue numerals; one ink-filled primary, ruled bands, hairlines, 2px radius; honour gold only on the record card.

STORY: the visitor sees someone training, reads "Statues aren't born. They're carved.", watches the phone finish a set and log a record, and creates a free account, or signs in.

FIRST VIEWPORT: at 1536x864 a transparent bar (lockup, Product, Pricing; EN/ES, Sign in, Start free); the text column left -- eyebrow, three-line h1 near 70px with the rule under "every set", lead, Create a free account filled beside Sign in, install line; the live-session phone right on the hero's lower edge; the video full-bleed, its subject in the right two thirds; pause lower right; the four-cell ruled proof band at the foot. At 390x844 a 56px bar (lockup, Start free, menu), centred text, actions side by side in English and stacked in Spanish, the proof band 2x2 inside the viewport.

FORM: the full-bleed video hero, comp A of three (A full-bleed, B split, C arch), approved 2026-11-21; drawn without the roll, so no seed key.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

**Unresolved:** how Pro is offered to an international audience paying in
ARS; whether real usage figures exist at launch.
