# Architectural Decision Records (ADRs)

This directory contains Architectural Decision Records (ADRs) for the Sunsteel Frontend project. ADRs document important architectural decisions made during the development process, including the context, decision, and consequences.

## Table of Contents

- [What are ADRs?](#what-are-adrs)
- [ADR Format](#adr-format)
- [Decision Records](#decision-records)
- [Decision Status](#decision-status)

## What are ADRs?

Architectural Decision Records (ADRs) are documents that capture important architectural decisions made along with their context and consequences. They help teams:

- Understand why certain decisions were made
- Avoid revisiting settled decisions
- Onboard new team members
- Learn from past decisions

## ADR Format

Each ADR follows a consistent format:

```markdown
# ADR-XXXX: [Decision Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[Description of the situation and problem that led to this decision]

## Decision
[The decision that was made and the reasoning behind it]

## Consequences
[The positive and negative consequences of this decision]

## Alternatives Considered
[Other options that were considered and why they were rejected]

## References
[Links to relevant documentation, discussions, or resources]
```

## Decision Records

### Core Architecture

- [ADR-0001: Next.js App Router Architecture](./adr-0001-nextjs-app-router.md)
- [ADR-0002: State Management with React Query](./adr-0002-react-query-state-management.md)
- [ADR-0003: Supabase Authentication Integration](./adr-0003-supabase-authentication.md)
- [ADR-0004: Component Architecture with Shadcn/ui](./adr-0004-shadcn-ui-components.md)

### Development Practices

- [ADR-0005: TypeScript Strict Configuration](./adr-0005-typescript-strict-config.md)
- [ADR-0006: Form Handling with React Hook Form](./adr-0006-react-hook-form.md)
- [ADR-0007: Testing Strategy with Vitest](./adr-0007-vitest-testing-strategy.md)

### Performance & Optimization

- [ADR-0008: Bundle Optimization Strategy](./adr-0008-bundle-optimization.md)
- [ADR-0009: Caching Strategy](./adr-0009-caching-strategy.md)

### UI/UX Design

- [ADR-0010: Classical Renaissance Design System](./adr-0010-classical-design-system.md)
- [ADR-0011: Responsive Design Approach](./adr-0011-responsive-design.md)

## Decision Status

### Accepted
Decisions that are currently in effect and being implemented.

### Proposed
Decisions that are under consideration but not yet implemented.

### Deprecated
Decisions that are no longer relevant or have been replaced.

### Superseded
Decisions that have been replaced by newer decisions.

---

## Contributing to ADRs

When making significant architectural decisions:

1. Create a new ADR using the next available number
2. Follow the standard format
3. Include all relevant context and alternatives
4. Get team review before marking as "Accepted"
5. Update this index with the new ADR

For questions about ADRs or architectural decisions, please refer to the [Architecture Documentation](../README.md) or reach out to the development team.