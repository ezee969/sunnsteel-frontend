# InitialLoadAnimation Component

## Overview

The `InitialLoadAnimation` component is a sophisticated loading screen that displays during the initial application load. It features a classical Renaissance-themed design with animated elements, responsive layouts, and smooth transitions. The component wraps the main application content and shows an elegant loading sequence before revealing the actual application.

## Import

```typescript
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The main application content to display after loading |

## Usage Examples

### Basic Usage

```tsx
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';
import { AppContent } from './AppContent';

export function App() {
  return (
    <InitialLoadAnimation>
      <AppContent />
    </InitialLoadAnimation>
  );
}
```

### With Layout Components

```tsx
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

export function Application() {
  return (
    <InitialLoadAnimation>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <MainContent />
        </div>
      </div>
    </InitialLoadAnimation>
  );
}
```

### In Next.js Layout

```tsx
// app/layout.tsx
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <InitialLoadAnimation>
          {children}
        </InitialLoadAnimation>
      </body>
    </html>
  );
}
```

## Features

### Animation Sequence
The component displays a carefully orchestrated animation sequence:

1. **Background Fade-in** (0-1s): Multi-layered background with classical imagery
2. **Title Entrance** (0.5-1.3s): "SUNNSTEEL" title with dramatic scaling and glow effects
3. **Ornate Divider** (0.9-1.5s): Classical laurel crown with decorative lines
4. **Subtitle** (1.2-1.7s): "Forge Your Path" tagline
5. **Symbol Animation** (1.4-2.2s): Three classical icons (shield, torch, laurel crown)
6. **Loading Indicator** (1.9-3.1s): Progress bar with "Preparing Your Training" text
7. **Content Transition** (3.2-3.5s): Smooth fade to main application

### Responsive Design

#### Desktop (lg and above)
- Uses `statue-inside-building.webp` background image
- Larger text sizes and spacing
- Full ornate frame and decorative elements
- Optimized for wide screens

#### Mobile/Tablet (below lg)
- Uses `angel-david-w-sword.webp` background image
- Smaller, touch-friendly sizing
- Condensed layout while maintaining visual impact
- Optimized for portrait orientations

### Visual Elements

#### Background Layers
- **Base Gradient**: Dark slate gradient for fallback
- **Hero Images**: Different images for desktop/mobile
- **Overlay Gradients**: Multiple gradients for depth and readability
- **Vignette Effect**: Radial gradient for edge darkening
- **Ornate Frames**: Nested border elements with golden accents

#### Typography
- **Primary Font**: "Cinzel" serif font for classical feel
- **Title**: Large, golden text with glow effects and shadows
- **Subtitle**: Smaller golden text with wide letter spacing
- **Labels**: Uppercase text with classical styling

#### Icons and Symbols
- **Classical Icons**: Shield, torch, and laurel crown
- **Golden Color Scheme**: Consistent use of gold/amber colors
- **Drop Shadows**: Glowing effects for visual depth

## Styling and Customization

### Color Scheme
```css
/* Primary Gold */
color: #DAA520; /* Main gold color */
text-shadow: 0 0 20px rgba(218, 165, 32, 0.5);

/* Secondary Gold */
color: #B8860B; /* Darker gold for subtitles */

/* Background Gradients */
background: linear-gradient(to bottom right, #1e293b, #475569, #000000);
```

### Typography Styles
```css
/* Main Title */
font-family: "Cinzel", "Times New Roman", serif;
font-weight: 900;
letter-spacing: 0.05em;
text-shadow: 0 0 20px rgba(218, 165, 32, 0.5), 
             0 0 40px rgba(218, 165, 32, 0.3), 
             2px 2px 4px rgba(0,0,0,0.8);

/* Subtitle */
font-family: "Cinzel", "Times New Roman", serif;
letter-spacing: 0.1em;
text-shadow: 0 0 10px rgba(184, 134, 11, 0.6), 
             1px 1px 2px rgba(0,0,0,0.8);
```

### Animation Timing
```typescript
// Component timing configuration
const CONTENT_SHOW_DELAY = 3200; // ms
const LOADING_EXIT_DELAY = 3500; // ms

// Individual animation delays
const TITLE_DELAY = 500;
const DIVIDER_DELAY = 900;
const SUBTITLE_DELAY = 1200;
const SYMBOLS_DELAY = 1400;
const LOADING_DELAY = 1900;
```

## Performance Considerations

### Image Optimization
- Uses Next.js `Image` component with `priority` flag
- WebP format for optimal compression
- Responsive image selection based on screen size
- Proper `object-cover` and `object-center` positioning

### Animation Performance
- Uses Framer Motion for hardware-accelerated animations
- Optimized animation properties (transform, opacity)
- Proper cleanup of timers and intervals
- Efficient re-rendering with AnimatePresence

### Bundle Impact
- Lazy loading not applicable (initial load component)
- Framer Motion already included in project dependencies
- Minimal additional JavaScript overhead

## Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Alternative text for background images
- Descriptive content for loading states

### Keyboard Navigation
- No interactive elements during loading sequence
- Proper focus management when content appears
- Maintains tab order for subsequent content

### Motion Preferences
```tsx
// Respect user's motion preferences
const prefersReducedMotion = useReducedMotion();

const animationProps = prefersReducedMotion 
  ? { initial: false, animate: false }
  : { initial: { opacity: 0 }, animate: { opacity: 1 } };
```

## Testing

### Unit Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';

describe('InitialLoadAnimation', () => {
  it('should show loading screen initially', () => {
    render(
      <InitialLoadAnimation>
        <div data-testid="app-content">App Content</div>
      </InitialLoadAnimation>
    );
    
    expect(screen.getByText('SUNNSTEEL')).toBeInTheDocument();
    expect(screen.getByText('Forge Your Path')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('should show content after loading completes', async () => {
    render(
      <InitialLoadAnimation>
        <div data-testid="app-content">App Content</div>
      </InitialLoadAnimation>
    );
    
    await waitFor(
      () => {
        expect(screen.getByTestId('app-content')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('should display loading progress', () => {
    render(
      <InitialLoadAnimation>
        <div>Content</div>
      </InitialLoadAnimation>
    );
    
    expect(screen.getByText('Preparing Your Training')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';
import { App } from '@/App';

describe('InitialLoadAnimation Integration', () => {
  it('should integrate with main app', async () => {
    render(
      <InitialLoadAnimation>
        <App />
      </InitialLoadAnimation>
    );
    
    // Loading screen should be visible
    expect(screen.getByText('SUNNSTEEL')).toBeInTheDocument();
    
    // Wait for app to load
    await waitFor(
      () => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('loading animation visual test', async ({ page }) => {
  await page.goto('/');
  
  // Capture loading screen
  await expect(page).toHaveScreenshot('loading-screen.png');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="app-content"]', { 
    timeout: 4000 
  });
  
  // Capture loaded state
  await expect(page).toHaveScreenshot('loaded-app.png');
});
```

## Common Patterns

### Conditional Loading
```tsx
// Show loading only on first visit
export function ConditionalLoadingApp({ children }: { children: React.ReactNode }) {
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const loaded = sessionStorage.getItem('app-loaded');
    setHasLoaded(!!loaded);
  }, []);
  
  if (hasLoaded) {
    return <>{children}</>;
  }
  
  return (
    <InitialLoadAnimation>
      {children}
    </InitialLoadAnimation>
  );
}
```

### Custom Timing
```tsx
// Extended loading for data fetching
export function DataLoadingAnimation({ 
  children, 
  isDataReady 
}: { 
  children: React.ReactNode;
  isDataReady: boolean;
}) {
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    if (isDataReady) {
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isDataReady]);
  
  if (showContent) {
    return <>{children}</>;
  }
  
  return <InitialLoadAnimation>{children}</InitialLoadAnimation>;
}
```

### Error Handling
```tsx
// Handle loading errors gracefully
export function SafeLoadingAnimation({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1>Loading Error</h1>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <InitialLoadAnimation>
        {children}
      </InitialLoadAnimation>
    </ErrorBoundary>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with hardware acceleration
- **Mobile Browsers**: Optimized for touch devices
- **Reduced Motion**: Respects user preferences
- **Fallbacks**: Graceful degradation for older browsers

## Related Components

- **ClassicalIcon**: Used for decorative symbols
- **Image**: Next.js Image component for backgrounds
- **AnimatePresence**: Framer Motion for transitions
- **Layout Components**: Often wraps main application layouts

## Migration Guide

### From Static Loading Screen

```typescript
// Before: Static loading
<div className="loading-screen">
  <div className="spinner" />
  <p>Loading...</p>
</div>

// After: Animated loading
<InitialLoadAnimation>
  <YourApp />
</InitialLoadAnimation>
```

### From Simple Spinner

```typescript
// Before: Basic spinner
{isLoading ? <Spinner /> : <App />}

// After: Full loading experience
<InitialLoadAnimation>
  <App />
</InitialLoadAnimation>
```