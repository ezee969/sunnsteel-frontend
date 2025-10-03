# Frontend Documentation Index

A comprehensive, navigable index of all frontend documentation. Use the category sections below to quickly find guides, references, and templates.

## Quick Links
- Overview: [Comprehensive Documentation Plan](./COMPREHENSIVE_DOCUMENTATION_PLAN.md)
- Security: [Auth & Security Implementation](./auth-security-implementation.md)

## Getting Started
- [Getting Started (Overview)](./getting-started/README.md)
- [Installation](./getting-started/installation.md)
- [Troubleshooting](./getting-started/troubleshooting.md)

## Architecture
- [Architecture (Overview)](./architecture/README.md)
- [Data Flow](./architecture/data-flow.md)
- ADRs (Architecture Decision Records):
  - [ADRs Index](./architecture/adrs/README.md)
  - [ADR-0001: Next.js App Router](./architecture/adrs/adr-0001-nextjs-app-router.md)
  - [ADR-0002: React Query State Management](./architecture/adrs/adr-0002-react-query-state-management.md)
  - [ADR-0003: Supabase Authentication](./architecture/adrs/adr-0003-supabase-authentication.md)

## API Integration
- [API Docs (Overview)](./api/README.md)
- Services:
  - [Authentication](./api/services/authentication.md)
  - [Exercises](./api/services/exercises.md)
  - [Routines](./api/services/routines.md)
  - [Training Max Adjustments](./api/services/tm-adjustments.md)
  - [Users](./api/services/users.md)
  - [Workouts](./api/services/workouts.md)

## Components
- [Components (Overview)](./components/README.md)
- Backgrounds:
  - [HeroBackdrop](./components/backgrounds/HeroBackdrop.md)
  - [OrnateCorners](./components/backgrounds/OrnateCorners.md)
  - [ParchmentOverlay](./components/backgrounds/ParchmentOverlay.md)
- Custom:
  - [InfoTooltip](./components/custom/InfoTooltip.md)
  - [InitialLoadAnimation](./components/custom/InitialLoadAnimation.md)
  - [PerformanceDebugPanel](./components/custom/PerformanceDebugPanel.md)
- Features:
  - [Features (Overview)](./components/features/README.md)
  - [Workout Dialogs](./components/features/workout-dialogs.md)
- Icons:
  - [ClassicalIcon](./components/icons/ClassicalIcon.md)
- Layout:
  - [HeroSection](./components/layout/HeroSection.md)

## Hooks
- [Hooks (Overview)](./hooks/README.md)

## Development
- [Development (Overview)](./development/README.md)
- [Testing Patterns](./development/testing-patterns.md)

## Examples
- [Examples (Overview)](./examples/README.md)
- [Backend API Integration](./examples/backend-api-integration.md)

## Reference
- [Reference (Overview)](./reference/README.md)
- [Frontend Architecture Reference](./reference/frontend-architecture.md)
- [Wizard Schedule](./reference/wizard-schedule.md)
- Utils:
  - [RTF Week Calculator](./reference/utils/rtf-week-calculator.md)

## Roadmaps
- [Frontend Improvements](./roadmaps/FRONTEND_IMPROVEMENTS.md)
- [RTF Enhancements](./roadmaps/RTF_ENHANCEMENTS.md)

## History
- [RTF Implementation Completion](./history/RTF_IMPLEMENTATION_COMPLETION.md)
- [RTF Frontend Completion (2025-01-23)](./history/RTF_FRONTEND_COMPLETION_2025-01-23.md)

## Templates
- [Templates (Overview)](./templates/README.md)
- [ADR Template](./templates/adr-template.md)
- [API Service Template](./templates/api-service-template.md)
- [Component Template](./templates/component-template.md)
- [Hook Template](./templates/hook-template.md)

## Conventions
- Documentation lives under `./docs/` and uses relative links for navigation.
- ADRs are organized under `./docs/architecture/adrs/`.
- API services are under `./docs/api/services/`.

## Notes on Client-Only UI Elements
UI elements that rely on client-only APIs (e.g., `crypto.randomUUID()` or time-based mutations) are deferred until after mount to avoid hydration mismatch warnings. When adding ephemeral UI containers (portals, overlays, notifications):
- Render nothing until `mounted === true`.
- Avoid non-deterministic functions during SSR.
- Add `suppressHydrationWarning` only at the minimal element boundary.
- Keep accessible live region attributes (`aria-live`, `aria-relevant`) on the client-rendered element once mounted.
