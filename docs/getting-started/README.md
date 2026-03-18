# Getting Started with Sunsteel Frontend

This guide gets the frontend running locally with the current `typecheck + lint + build` workflow.

## Prerequisites

- Node.js 18+
- npm
- Git

## Installation

```bash
git clone <repository-url>
cd sunnsteel-frontend
npm install
```

## Environment Setup

Create `.env.local` and configure:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS=true
NEXT_PUBLIC_ENABLE_RTF_DEBUG=true
```

## Running the App

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Available Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Development Workflow

1. Create a branch for your change.
2. Implement the feature or fix.
3. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
4. Manually verify the affected flows in the browser.
5. Open a pull request.

## Troubleshooting

- If `.next` is stale, remove it and restart the dev server.
- If environment variables are not loading, confirm `.env.local` is in the project root.
- If the build fails, run `npm run typecheck` and `npm run lint` first to narrow the issue.
