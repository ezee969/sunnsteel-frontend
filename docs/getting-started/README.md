# Getting Started with Sunsteel Frontend

Welcome to the Sunsteel Frontend project! This guide will help you set up your development environment and get the application running locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (version 18 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`
- **Git** for version control
  - Download from [git-scm.com](https://git-scm.com/)

### Recommended Tools

- **Visual Studio Code** or your preferred IDE
- **Windows Terminal** or PowerShell (for Windows users)
- **Chrome DevTools** or similar browser developer tools

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sunnsteel-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Next.js 15.4.6 with App Router
- React 18.3.1
- TailwindCSS v4
- TypeScript 5
- Supabase client
- TanStack Query v5
- And many more...

### 3. Verify Installation

```bash
npm run build
```

If the build completes successfully, your installation is ready!

## Environment Setup

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env.local
```

### 2. Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Development Flags
NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS=true
NEXT_PUBLIC_ENABLE_RTF_DEBUG=true
```

### 3. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the environment variables accordingly
4. Set up authentication providers in your Supabase dashboard

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Other Available Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run type-check

# Analyze bundle size
npm run analyze
```

## Project Structure

```
sunsteel-frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   └── (protected)/       # Protected application routes
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui base components
│   └── backgrounds/      # Classical theme components
├── features/             # Feature-specific modules
│   ├── routines/        # Routine management
│   └── shell/           # Application shell
├── lib/                 # Core application logic
│   ├── api/            # API services and hooks
│   ├── utils/          # Utility functions
│   └── supabase/       # Supabase client
├── providers/          # React context providers
├── hooks/             # Custom React hooks
├── schema/           # Zod validation schemas
└── docs/            # Documentation
```

## Development Workflow

### 1. Feature Development

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Develop your feature following the [Architecture Guidelines](../architecture/README.md)
3. Write tests for your components and hooks
4. Run the test suite: `npm test`
5. Create a pull request

### 2. Code Quality

- **TypeScript**: All code must be properly typed
- **ESLint**: Follow the configured linting rules
- **Testing**: Write tests for new components and features
- **Accessibility**: Ensure WCAG compliance

### 3. Commit Conventions

Use conventional commit messages:

```bash
feat: add new routine creation wizard
fix: resolve authentication redirect issue
docs: update API documentation
test: add tests for routine components
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on a different port
npm run dev -- -p 3001
```

#### Environment Variables Not Loading

1. Ensure `.env.local` is in the project root
2. Restart the development server
3. Check that variable names start with `NEXT_PUBLIC_` for client-side access

#### Supabase Connection Issues

1. Verify your Supabase URL and anon key
2. Check your Supabase project status
3. Ensure authentication providers are configured

#### Build Errors

1. Clear Next.js cache: `rm -rf .next`
2. Clear node modules: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`

#### Hydration Errors

1. Check for client-side only code in server components
2. Use `suppressHydrationWarning` sparingly
3. Ensure consistent rendering between server and client

### Getting Help

- **Documentation**: Check the [docs](../README.md) directory
- **Issues**: Create an issue in the repository
- **Architecture**: Review [Architecture Guidelines](../architecture/README.md)
- **Components**: See [Component Library](../components/README.md)

## Next Steps

Now that you have the application running, explore these areas:

### 1. Learn the Architecture

- Read the [Architecture Overview](../architecture/README.md)
- Understand the [Data Flow Patterns](../architecture/data-flow.md)
- Review [Routing Configuration](../architecture/routing.md)

### 2. Explore Components

- Browse the [Component Library](../components/README.md)
- Check out [UI Components](../components/ui-components.md)
- Learn about [Feature Components](../components/feature-components.md)

### 3. API Integration

- Review [API Documentation](../api/README.md)
- Understand [React Query Patterns](../api/react-query.md)
- Learn about [Authentication Flow](../api/authentication.md)

### 4. Development Guidelines

- Follow [Testing Guidelines](../development/testing.md)
- Implement [Performance Best Practices](../development/performance.md)
- Maintain [Code Quality Standards](../development/code-quality.md)

### 5. Examples and Tutorials

- Try [Building Your First Feature](../examples/first-feature.md)
- Learn [Form Handling Patterns](../examples/form-handling.md)
- Explore [Advanced Patterns](../examples/advanced-patterns.md)

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](../development/contributing.md) and [Code of Conduct](../development/code-of-conduct.md) before getting started.

---

**Happy coding!** 🚀

For more detailed information, explore the complete documentation in the [docs](../README.md) directory.