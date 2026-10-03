---
name: sunnsteel-design
description: Sunnsteel's way of using general design skills on this app. Use for any work that changes how Sunnsteel looks, moves or is laid out -- a new screen, a restyle, a design review, or applying advice from frontend-design, ui-ux-pro-max or web-design-guidelines.
---

# Using design skills on Sunnsteel

Sunnsteel has a documented visual system: [docs/ui-design-system.md](../../../docs/ui-design-system.md) (with its dated amendments, §18 onward) and [docs/ui-motion-spec.md](../../../docs/ui-motion-spec.md). General design skills are useful critique, but they are written for no project in particular, so their defaults sometimes contradict choices this app made on purpose. The system is the brief; the skills review work against it.

## Before designing

Read the parts of the design system the change touches. CLAUDE.md lists the sections every UI change needs (§4.3, §5.3, §§7–10, §15 and the component's §11 subsection); add the amendment that owns the surface (for example §22 for the workout screen's larger controls, §24 for a profile header, §26 for the shell, the masthead and pinned rows).

## Consulting a skill

Run the skill against the work, then sort each piece of advice:

- **Fixes a defect** -- contrast, focus visibility or focus hidden by pinned UI, touch targets, a missing accessible name, decorative icons not hidden, overflow, reduced motion ignored. Apply it; no amendment is needed, because the system already requires these.
- **Fits the system** -- the advice serves a rule the system states (sentence case outside region labels, one filled action per region, ruled lists before boxes). Apply it.
- **Contradicts a documented rule** -- for instance avoiding uppercase labels, monospace data, hairline rules, zero radii or instant press feedback. The rule stands. Change it only as a deliberate amendment: say what is superseded and why, update the canonical document and the shared implementation together, and record it the way §26.0 records v1.1.
- **Belongs to another product** -- palettes, styles or effects the brief rules out (neon fitness colour, glass, gradients, scattered entrance animation). Decline it.

## Recording

Keep a short log of what was adopted, adapted and declined, with the reason, in the change's coverage record or amendment. When advice is adopted, encode it where the next agent meets it without the skill: a token, a primitive, a design-system rule or a test.
