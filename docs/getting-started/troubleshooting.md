# Troubleshooting Guide

Use this guide for common frontend setup and development issues.

## Core Checks

Run these first:

```bash
npm run typecheck
npm run lint
npm run build
```

## Common Issues

### Port Already in Use

```bash
npx kill-port 3000
npm run dev -- -p 3001
```

### Dev Server Will Not Start

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Build Errors

- Fix reported TypeScript issues from `npm run typecheck`
- Fix lint errors or warnings that are relevant to the changed area
- Confirm required `NEXT_PUBLIC_*` environment variables are present

### Manual Verification Problems

If a changed flow still behaves unexpectedly after checks pass:

1. Clear `.next` and restart the dev server.
2. Reproduce the issue in a clean browser session.
3. Re-check the critical flows manually:
   - authentication
   - routine CRUD
   - workout session start/log/finish
   - RtF-related screens and endpoints
