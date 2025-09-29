# Component Library Documentation

## Overview

The Sunsteel Frontend component library features custom components built for the classical Renaissance fitness application theme. This documentation covers all custom components, their usage patterns, and integration guidelines.

## Component Architecture

### Design System Foundation

The component library follows a layered architecture:

1. **Base Layer**: Shadcn/ui components (see individual component files for usage)
2. **Custom Layer**: Application-specific components with classical theming
3. **Feature Layer**: Domain-specific components for routines, workouts, etc.
4. **Layout Layer**: Application shell and structural components

### Component Categories

#### Custom Components (`/components/`)
Application-specific components with unique functionality.

- [InfoTooltip](./custom/InfoTooltip.md) - Enhanced tooltip with classical styling
- [InitialLoadAnimation](./custom/InitialLoadAnimation.md) - App startup animation
- [PerformanceDebugPanel](./custom/PerformanceDebugPanel.md) - Development performance tools

#### Background Components (`/components/backgrounds/`)
Decorative and visual enhancement components.

- [HeroBackdrop](./backgrounds/HeroBackdrop.md) - Blurred background images with overlays
- [OrnateCorners](./backgrounds/OrnateCorners.md) - Classical decorative corner elements
- [ParchmentOverlay](./backgrounds/ParchmentOverlay.md) - Texture overlay for classical theming

#### Icon Components (`/components/icons/`)
Classical icon system for the application.

- [ClassicalIcon](./icons/ClassicalIcon.md) - SVG icon system with CSS masks

#### Layout Components (`/components/layout/`)
Structural components for page layouts.

- [HeroSection](./layout/HeroSection.md) - Hero sections with background and content

#### Background Components (`/components/backgrounds/`)
#### Feature Components (`/features/`)
Domain-specific components organized by feature area.

- [Feature Components Overview](./features/README.md) - Complete list of routine and shell components

## Design Principles

### Classical Renaissance Theme

The component library implements a classical Renaissance design language with rich colors, classical typography, and elegant styling.

### Accessibility Standards

All components follow WCAG 2.1 AA guidelines with keyboard navigation, screen reader support, and proper contrast ratios.

### Responsive Design

Components are designed mobile-first with consistent breakpoints and touch-friendly interfaces.

## Usage Guidelines

### Import Patterns

```typescript
// Custom Components
import { InfoTooltip } from '@/components/InfoTooltip';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

// Background Components
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

// Layout Components
import { HeroSection } from '@/components/layout/HeroSection';

// Feature Components
import { RoutineCard } from '@/features/routines/components/RoutineCard';
import { Header } from '@/features/shell/components/Header';
```

### Component Composition

```typescript
// Example: Hero section with background
<HeroSection
  imageSrc="/backgrounds/art-bg-1.webp"
  title="Dashboard"
  subtitle="Track your fitness journey"
/>

// Example: Classical icon usage
<ClassicalIcon name="dumbbell" className="w-6 h-6 text-gold-500" />
```

## Development Guidelines

### Component Structure

Follow TypeScript patterns with proper interfaces, accessibility attributes, and classical theming support.

### Testing Standards

Include unit tests, accessibility tests, and visual regression testing for all components.

## Browser Support

Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with full accessibility support.

## Related Documentation

- [API Documentation](../api/README.md) - Backend integration
- [Architecture](../architecture/README.md) - System architecture
- [Getting Started](../getting-started/README.md) - Setup and installation