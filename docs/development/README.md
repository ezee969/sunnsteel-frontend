# Development Guidelines

Brief standards and workflows for the Sunsteel frontend.

## Quick Start

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Quality Baseline

- Keep `npm run typecheck`, `npm run lint`, and `npm run build` green before merging
- Manually verify the browser flows affected by your change
- Prioritize auth, routine CRUD, workout session, and RtF-related screens for manual checks

## Code Standards

- Use strict TypeScript and clear prop typing
- Prefer small hooks for stateful behavior
- Keep components focused and composable
- Use React Query for server state and local state for UI-only concerns

## Development Tools

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for static checking
- **Next.js** for build validation

## Deployment Check

```bash
npm run typecheck
npm run lint
npm run build
```
