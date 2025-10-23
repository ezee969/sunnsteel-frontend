# HeroBackdrop Component

## Overview

The `HeroBackdrop` component is a sophisticated background component designed for hero sections and large content areas. It renders a blurred background image with customizable overlays, supports theme-aware backgrounds, and provides a foundation for foreground content. The component is optimized for performance and accessibility while maintaining visual appeal.

## Import

```typescript
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | **Required.** Path to the background image (e.g., `/backgrounds/hero-desktop.webp`) |
| `darkSrc` | `string` | - | Optional dark theme variant image |
| `blurPx` | `number` | `18` | Intensity of blur effect in pixels |
| `overlayColor` | `string` | `'rgba(0,0,0,0.25)'` | Solid color overlay |
| `overlayGradient` | `string` | - | CSS gradient overlay (overrides `overlayColor` if provided) |
| `className` | `string` | - | Additional CSS classes |
| `style` | `React.CSSProperties` | - | Inline styles |
| `darkFilter` | `string` | `'brightness(0.5) saturate(0.95)'` | CSS filter applied in dark mode |
| `children` | `React.ReactNode` | - | Foreground content to display over the backdrop |

## Usage Examples

### Basic Usage

```tsx
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

export function HeroSection() {
  return (
    <HeroBackdrop 
      src="/backgrounds/classical-statue.webp"
      className="min-h-screen"
    >
      <div className="flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">
          Welcome to Sunsteel
        </h1>
      </div>
    </HeroBackdrop>
  );
}
```

### Theme-Aware Background

```tsx
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

export function ThemedHero() {
  return (
    <HeroBackdrop 
      darkFilter="brightness(0.3) contrast(1.2)"
      className="h-96"
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Classical Training
          </h2>
          <p className="text-xl text-gray-200">
            Forge your strength with timeless methods
          </p>
        </div>
      </div>
    </HeroBackdrop>
  );
}
```

### Custom Overlay and Blur

```tsx
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

export function CustomStyledHero() {
  return (
    <HeroBackdrop 
      src="/backgrounds/training-hall.webp"
      blurPx={25}
      overlayGradient="linear-gradient(45deg, rgba(218,165,32,0.3), rgba(184,134,11,0.5))"
      className="h-screen"
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-7xl font-black text-amber-100 mb-6">
          STRENGTH
        </h1>
        <p className="text-2xl text-amber-200 max-w-2xl">
          Transform your body through classical training principles
        </p>
      </div>
    </HeroBackdrop>
  );
}
```

### Minimal Blur with Solid Overlay

```tsx
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

export function SubtleBackdrop() {
  return (
    <HeroBackdrop 
      src="/backgrounds/gym-equipment.webp"
      blurPx={8}
      overlayColor="rgba(0,0,0,0.6)"
      className="h-80"
    >
      <div className="p-8">
        <h3 className="text-3xl font-semibold text-white mb-4">
          Equipment Guide
        </h3>
        <p className="text-lg text-gray-300">
          Learn to use classical training equipment effectively
        </p>
      </div>
    </HeroBackdrop>
  );
}
```

### Complex Content Layout

```tsx
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';
import { Button } from '@/components/ui/button';

export function ComplexHeroLayout() {
  return (
    <HeroBackdrop 
      src="/backgrounds/ancient-gymnasium.webp"
      darkSrc="/backgrounds/ancient-gymnasium-night.webp"
      overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))"
      className="min-h-screen"
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex flex-col justify-center h-full py-20">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6">
              FORGE YOUR
              <span className="block text-amber-400">DESTINY</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl">
              Join the ranks of warriors who have transformed their bodies 
              through disciplined training and unwavering dedication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="classical">
                Start Training
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </HeroBackdrop>
  );
}
```

## Features

### Theme Integration
- **Automatic Theme Detection**: Uses `next-themes` for theme awareness
- **Dark Mode Support**: Separate images and filters for dark theme
- **Hydration Safety**: Prevents SSR/client mismatches with mounted state
- **Blend Modes**: Uses CSS blend modes for enhanced dark mode effects

### Performance Optimization
- **Next.js Image**: Leverages optimized image loading
- **Scale Transform**: Prevents edge artifacts from blur effect
- **Efficient Rendering**: Minimal re-renders with proper dependency management
- **Priority Loading**: Configurable image priority for critical content

### Visual Effects
- **Blur Control**: Customizable blur intensity
- **Overlay System**: Support for solid colors and gradients
- **Filter Effects**: CSS filters for theme-specific adjustments
- **Layered Composition**: Proper z-index management for content layering

## Styling and Customization

### Default Styling
```css
/* Container */
.hero-backdrop {
  position: relative;
  overflow: hidden;
}

/* Background Image */
.backdrop-image {
  position: absolute;
  inset: 0;
  object-fit: cover;
  user-select: none;
  filter: blur(18px);
  transform: scale(1.06); /* Prevent edge cropping */
  transform-origin: center;
}

/* Overlay */
.backdrop-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: normal; /* multiply in dark mode */
}

/* Content */
.backdrop-content {
  position: relative;
  z-index: 10;
}
```

### Custom Blur Effects
```tsx
// Subtle blur for readability
<HeroBackdrop src="/bg.webp" blurPx={5} />

// Heavy blur for abstract effect
<HeroBackdrop src="/bg.webp" blurPx={40} />

// No blur for sharp background
<HeroBackdrop src="/bg.webp" blurPx={0} />
```

### Gradient Overlays
```tsx
// Vertical gradient
<HeroBackdrop 
  src="/bg.webp"
  overlayGradient="linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))"
/>

// Radial gradient
<HeroBackdrop 
  src="/bg.webp"
  overlayGradient="radial-gradient(circle at center, rgba(0,0,0,0.2), rgba(0,0,0,0.8))"
/>

// Multi-stop gradient
<HeroBackdrop 
  src="/bg.webp"
  overlayGradient="linear-gradient(45deg, rgba(218,165,32,0.3) 0%, rgba(184,134,11,0.5) 50%, rgba(0,0,0,0.7) 100%)"
/>
```

## Accessibility Features

### Screen Reader Support
- **Decorative Images**: Uses `alt=""` and `aria-hidden` for background images
- **Semantic Structure**: Maintains proper heading hierarchy in content
- **Focus Management**: Ensures interactive content remains accessible

### Keyboard Navigation
- **Content Focus**: Foreground content maintains proper tab order
- **Interactive Elements**: Buttons and links work normally over backdrop
- **Skip Links**: Compatible with skip navigation patterns

### Visual Accessibility
- **Contrast Ratios**: Overlay system ensures sufficient text contrast
- **Motion Preferences**: Respects user motion preferences
- **Color Independence**: Information not conveyed through color alone

## Performance Considerations

### Image Optimization
- **WebP Format**: Recommends modern image formats
- **Responsive Images**: Uses Next.js Image component optimizations
- **Lazy Loading**: Configurable priority loading
- **Transform Optimization**: Hardware-accelerated CSS transforms

### Rendering Performance
- **Minimal Re-renders**: Efficient state management
- **CSS-Only Effects**: Uses CSS for visual effects where possible
- **Proper Cleanup**: No memory leaks from event listeners
- **Hydration Optimization**: Prevents unnecessary re-renders

### Bundle Impact
- **Lightweight**: Minimal JavaScript overhead
- **Tree Shaking**: Only imports necessary dependencies
- **CSS-in-JS**: Inline styles for dynamic properties only

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

describe('HeroBackdrop', () => {
  it('should render background image', () => {
    render(
      <HeroBackdrop src="/test-bg.webp">
        <div data-testid="content">Test Content</div>
      </HeroBackdrop>
    );
    
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveAttribute('src', expect.stringContaining('test-bg.webp'));
  });

  it('should render children content', () => {
    render(
      <HeroBackdrop src="/test-bg.webp">
        <div data-testid="content">Test Content</div>
      </HeroBackdrop>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom blur', () => {
    render(
      <HeroBackdrop src="/test-bg.webp" blurPx={25}>
        <div>Content</div>
      </HeroBackdrop>
    );
    
    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveStyle({ filter: 'blur(25px)' });
  });
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { HeroBackdrop } from '@/components/backgrounds/HeroBackdrop';

describe('HeroBackdrop Theme Integration', () => {
  it('should use dark image in dark theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <HeroBackdrop 
          src="/light-bg.webp" 
          darkSrc="/dark-bg.webp"
        >
          <div>Content</div>
        </HeroBackdrop>
      </ThemeProvider>
    );
    
    // Note: This test would need to account for the mounted state
    // and may require additional setup for theme testing
  });
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('hero backdrop visual test', async ({ page }) => {
  await page.goto('/hero-test');
  
  // Wait for image to load
  await page.waitForLoadState('networkidle');
  
  // Capture screenshot
  await expect(page.locator('[data-testid="hero-backdrop"]')).toHaveScreenshot('hero-backdrop.png');
});
```

## Common Patterns

### Responsive Hero Heights
```tsx
// Responsive height classes
<HeroBackdrop 
  src="/bg.webp"
  className="h-64 md:h-96 lg:h-screen"
>
  {/* Content */}
</HeroBackdrop>
```

### Loading States
```tsx
// Show placeholder while image loads
export function HeroWithLoading() {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      <HeroBackdrop 
        src="/bg.webp"
        onLoad={() => setImageLoaded(true)}
      >
        {/* Content */}
      </HeroBackdrop>
    </div>
  );
}
```

### Parallax Effect
```tsx
// Simple parallax with transform
export function ParallaxHero() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <HeroBackdrop 
      src="/bg.webp"
      style={{ transform: `translateY(${scrollY * 0.5}px)` }}
    >
      {/* Content */}
    </HeroBackdrop>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with CSS filters and blend modes
- **Mobile Browsers**: Optimized for touch devices and smaller screens
- **Fallbacks**: Graceful degradation for older browsers
- **Performance**: Hardware acceleration where available

## Related Components

- **ParchmentOverlay**: Texture overlay component
- **OrnateCorners**: Decorative corner elements
- **Image**: Next.js Image component
- **ClassicalIcon**: Icon components for hero content

## Migration Guide

### From Static Background Images

```css
/* Before: CSS background */
.hero {
  background-image: url('/bg.webp');
  background-size: cover;
  background-position: center;
  filter: blur(10px);
}
```

```tsx
// After: HeroBackdrop component
<HeroBackdrop 
  src="/bg.webp" 
  blurPx={10}
  className="hero"
>
  {/* Content */}
</HeroBackdrop>
```

### From Basic Image Elements

```tsx
// Before: Basic img element
<div className="relative">
  <img 
    src="/bg.webp" 
    className="absolute inset-0 w-full h-full object-cover blur-lg" 
  />
  <div className="relative z-10">{content}</div>
</div>

// After: HeroBackdrop component
<HeroBackdrop src="/bg.webp" blurPx={16}>
  {content}
</HeroBackdrop>
```