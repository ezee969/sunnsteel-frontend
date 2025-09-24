# Sunsteel Design System Style Guide

This document enumerates the design tokens, CSS custom properties, and usage guidelines for the Sunsteel fitness application.

## Table of Contents

- [Color System](#color-system)
- [Typography](#typography)  
- [Spacing](#spacing)
- [Component Patterns](#component-patterns)
- [Theme Usage](#theme-usage)

## Color System

### Base Colors
Our design system uses CSS custom properties for theming support (light/dark mode).

#### Primary Colors
```css
--primary: hsl(210 40% 8%);           /* Dark navy for primary actions */
--primary-foreground: hsl(210 40% 98%); /* Light text on primary */
```

#### Background Colors
```css
--background: hsl(0 0% 100%);         /* Page background (light) */
--foreground: hsl(210 40% 8%);        /* Primary text color */
--muted: hsl(210 40% 96%);            /* Subtle background areas */
--muted-foreground: hsl(215.4 16.3% 46.9%); /* Muted text */
```

#### UI Element Colors
```css
--card: hsl(0 0% 100%);               /* Card backgrounds */
--card-foreground: hsl(210 40% 8%);   /* Card text */
--border: hsl(214.3 31.8% 91.4%);     /* Border color */
--input: hsl(214.3 31.8% 91.4%);      /* Input backgrounds */
--ring: hsl(210 40% 8%);              /* Focus rings */
```

#### Semantic Colors
```css
--destructive: hsl(0 84.2% 60.2%);        /* Error/delete actions */
--destructive-foreground: hsl(210 40% 98%); /* Text on destructive */
--warning: hsl(38 92% 50%);               /* Warning states */  
--success: hsl(142 76% 36%);              /* Success states */
```

### Usage Guidelines

#### Primary Actions
- Use `bg-primary text-primary-foreground` for main CTAs
- Use `hover:bg-primary/90` for hover states

#### Secondary Actions  
- Use `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- Provides subtle interaction feedback

#### Destructive Actions
- Use `bg-destructive text-destructive-foreground hover:bg-destructive/90`
- For delete buttons, critical actions

#### Muted Content
- Use `text-muted-foreground` for helper text, placeholders
- Use `bg-muted` for subtle background sections

## Typography

### Font Families
```css
--font-oswald: 'Oswald', sans-serif;      /* Headings, strong emphasis */
--font-space-mono: 'Space Mono', monospace; /* Code, data display */  
--font-bebas-neue: 'Bebas Neue', sans-serif; /* Brand/display text */
--font-cinzel: 'Cinzel', serif;          /* Decorative/premium feel */
```

### Font Scales
Built on Tailwind's type scale:

```css
text-xs    /* 12px - Fine print, captions */
text-sm    /* 14px - Secondary text, labels */  
text-base  /* 16px - Body text default */
text-lg    /* 18px - Prominent body text */
text-xl    /* 20px - Small headings */
text-2xl   /* 24px - Section headings */
text-3xl   /* 30px - Page headings */
```

### Usage Patterns

#### Headings
- Page titles: `text-3xl font-bold font-oswald`
- Section headers: `text-2xl font-semibold`  
- Card titles: `text-lg font-medium`

#### Body Text
- Primary: `text-base` (default)
- Secondary: `text-sm text-muted-foreground`
- Fine print: `text-xs text-muted-foreground`

#### Data Display
- Metrics/numbers: `font-space-mono font-bold`
- Set/rep counts: `text-lg font-semibold font-space-mono`

## Spacing

### Scale
Uses Tailwind's spacing scale (0.25rem increments):
- `p-1` = 0.25rem (4px)
- `p-2` = 0.5rem (8px) 
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

### Common Patterns

#### Card Spacing
```css
.card-padding {
  @apply p-4 sm:p-6; /* Responsive: 16px mobile, 24px desktop */
}
```

#### Section Spacing
```css
.section-gap {
  @apply space-y-6; /* 24px vertical rhythm */
}
```

#### Button Spacing
```css  
.btn-padding {
  @apply px-4 py-2; /* 16px horizontal, 8px vertical */
}
```

## Component Patterns

### Cards
```tsx
<Card className="p-4 sm:p-6 space-y-4">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Content</p>
  </CardContent>
</Card>
```

### Save State Indicators
```tsx
// Using semantic colors with dot indicators
<span className="flex items-center gap-1 text-green-600 dark:text-green-400">
  <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
  Saved
</span>
```

### Focus States
- Use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- For keyboard navigation accessibility

### Responsive Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */  
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
```

## Theme Usage

### Dark Mode Support
All colors automatically adapt via CSS custom properties:

```tsx
// Light theme
<html className="light">

// Dark theme  
<html className="dark">
```

### Theme-Aware Components
```tsx
// Colors automatically adapt
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">This text adapts to theme</p>
</div>
```

### Manual Theme Colors
When needed, use explicit dark variants:
```tsx
<span className="text-amber-600 dark:text-amber-400">
  Explicitly themed element
</span>
```

## Best Practices

### Do's ✅
- Use semantic color tokens (`--primary`, `--muted-foreground`)
- Follow spacing patterns for consistency
- Test in both light and dark themes
- Use appropriate font families for context
- Include focus states for accessibility

### Don'ts ❌  
- Avoid hardcoded color values (`#ff0000`)
- Don't mix spacing scales arbitrarily
- Avoid font mixing without purpose
- Don't forget hover/focus states
- Don't rely solely on color for meaning

## Component-Specific Guidelines

### Routine Cards
- Use `font-oswald` for routine names
- `font-space-mono` for set/rep counts
- Muted colors for metadata

### Workout Sessions
- Save state indicators with colored dots
- `text-lg font-semibold` for current values
- Subtle borders for input focus

### Navigation
- Primary color for active states
- Muted colors for inactive items
- Proper focus rings for keyboard users

---

This style guide ensures consistent visual design and provides clear implementation guidance for developers working on the Sunsteel application.