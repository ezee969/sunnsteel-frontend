# ParchmentOverlay Component

## Overview

The `ParchmentOverlay` component is a sophisticated CSS-only texture overlay that creates a subtle parchment or aged paper effect. Designed to enhance the classical Renaissance theme, it adds depth and texture to backgrounds without requiring image assets. The component is highly performant, theme-aware, and provides customizable texture intensity and coloring.

## Import

```typescript
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `opacity` | `number` | `0.15` | Overall opacity of the parchment effect (0-1) |
| `tint` | `string` | `'warm'` | Color tint: `'warm'`, `'cool'`, `'neutral'`, or custom CSS color |
| `grain` | `'fine' \| 'medium' \| 'coarse'` | `'medium'` | Texture grain intensity |
| `className` | `string` | - | Additional CSS classes for the overlay container |
| `style` | `React.CSSProperties` | - | Inline styles for the overlay container |
| `children` | `React.ReactNode` | - | Content to display over the parchment texture |

## Usage Examples

### Basic Usage

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export function ParchmentCard() {
  return (
    <div className="relative p-8 bg-amber-50 rounded-lg">
      <ParchmentOverlay />
      <h2 className="text-2xl font-bold text-amber-900 mb-4">
        Ancient Wisdom
      </h2>
      <p className="text-amber-800">
        Discover the timeless principles of strength training 
        passed down through generations of warriors.
      </p>
    </div>
  );
}
```

### Custom Opacity and Tint

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export function CustomParchmentSection() {
  return (
    <section className="relative py-16 bg-gradient-to-br from-amber-100 to-amber-200">
      <ParchmentOverlay 
        opacity={0.25}
        tint="warm"
        grain="coarse"
      />
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-5xl font-black text-amber-900 text-center mb-8">
          CLASSICAL TRAINING
        </h1>
        <p className="text-xl text-amber-800 text-center max-w-3xl mx-auto">
          Embrace the ancient methods that forged the strongest warriors 
          in history. Every rep, every set, every breath connects you 
          to a legacy of excellence.
        </p>
      </div>
    </section>
  );
}
```

### Different Grain Textures

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export function GrainComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Fine grain */}
      <div className="relative p-6 bg-amber-50 rounded-lg">
        <ParchmentOverlay grain="fine" opacity={0.2} />
        <h3 className="text-lg font-semibold mb-2">Fine Grain</h3>
        <p className="text-sm text-gray-700">
          Subtle texture for elegant, refined content areas.
        </p>
      </div>
      
      {/* Medium grain */}
      <div className="relative p-6 bg-amber-50 rounded-lg">
        <ParchmentOverlay grain="medium" opacity={0.2} />
        <h3 className="text-lg font-semibold mb-2">Medium Grain</h3>
        <p className="text-sm text-gray-700">
          Balanced texture for general content and card backgrounds.
        </p>
      </div>
      
      {/* Coarse grain */}
      <div className="relative p-6 bg-amber-50 rounded-lg">
        <ParchmentOverlay grain="coarse" opacity={0.2} />
        <h3 className="text-lg font-semibold mb-2">Coarse Grain</h3>
        <p className="text-sm text-gray-700">
          Bold texture for dramatic effect and hero sections.
        </p>
      </div>
    </div>
  );
}
```

### Theme-Aware Tinting

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';
import { useTheme } from 'next-themes';

export function ThemedParchment() {
  const { theme } = useTheme();
  
  return (
    <div className="relative p-8 bg-card rounded-lg border">
      <ParchmentOverlay 
        tint={theme === 'dark' ? 'cool' : 'warm'}
        opacity={theme === 'dark' ? 0.1 : 0.2}
      />
      <h2 className="text-2xl font-bold mb-4">
        Adaptive Parchment
      </h2>
      <p className="text-muted-foreground">
        This parchment overlay adapts its tint and intensity 
        based on your theme preference.
      </p>
    </div>
  );
}
```

### Custom Color Tinting

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export function CustomTintedParchment() {
  return (
    <div className="space-y-6">
      {/* Sepia tint */}
      <div className="relative p-6 bg-yellow-50 rounded-lg">
        <ParchmentOverlay tint="#8b4513" opacity={0.15} />
        <h3 className="text-lg font-semibold text-yellow-900">
          Sepia Parchment
        </h3>
        <p className="text-yellow-800">
          Classic aged paper effect with sepia toning.
        </p>
      </div>
      
      {/* Blue tint */}
      <div className="relative p-6 bg-blue-50 rounded-lg">
        <ParchmentOverlay tint="#4682b4" opacity={0.12} />
        <h3 className="text-lg font-semibold text-blue-900">
          Cool Parchment
        </h3>
        <p className="text-blue-800">
          Modern twist with cool blue undertones.
        </p>
      </div>
      
      {/* Purple tint */}
      <div className="relative p-6 bg-purple-50 rounded-lg">
        <ParchmentOverlay tint="hsl(270, 50%, 40%)" opacity={0.18} />
        <h3 className="text-lg font-semibold text-purple-900">
          Royal Parchment
        </h3>
        <p className="text-purple-800">
          Regal purple tint for premium content areas.
        </p>
      </div>
    </div>
  );
}
```

### Layered Parchment Effects

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export function LayeredParchmentCard() {
  return (
    <div className="relative p-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
      {/* Base parchment layer */}
      <ParchmentOverlay 
        opacity={0.2} 
        tint="warm" 
        grain="coarse" 
      />
      
      <div className="relative p-6 bg-amber-50/80 rounded-lg">
        {/* Inner parchment layer */}
        <ParchmentOverlay 
          opacity={0.15} 
          tint="neutral" 
          grain="fine" 
        />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-amber-900 mb-4">
            Layered Texture
          </h2>
          <p className="text-amber-800 leading-relaxed">
            Multiple parchment layers create depth and visual interest, 
            perfect for highlighting important content or creating 
            sophisticated card designs.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Interactive Parchment

```tsx
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';
import { useState } from 'react';

export function InteractiveParchmentCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative p-8 bg-amber-50 rounded-lg cursor-pointer transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ParchmentOverlay 
        opacity={isHovered ? 0.3 : 0.15}
        grain={isHovered ? 'coarse' : 'medium'}
        tint="warm"
        style={{
          transition: 'opacity 0.5s ease, filter 0.5s ease',
        }}
      />
      
      <h3 className="text-xl font-semibold text-amber-900 mb-3">
        Interactive Texture
      </h3>
      <p className="text-amber-800">
        Hover to see the parchment texture intensify and become more pronounced.
      </p>
    </div>
  );
}
```

## Features

### Pure CSS Implementation
- **Zero JavaScript**: Entirely CSS-based using gradients and blend modes
- **Hardware Acceleration**: Leverages GPU for smooth rendering
- **Minimal DOM**: Uses pseudo-elements for texture layers
- **Performance Optimized**: No image loading or processing overhead

### Texture Generation
- **Layered Gradients**: Multiple radial gradients create organic texture
- **Noise Patterns**: CSS-generated noise for authentic parchment feel
- **Blend Modes**: Strategic use of multiply and overlay blend modes
- **Responsive Scaling**: Texture scales appropriately with container size

### Theme Integration
- **Automatic Adaptation**: Adjusts tint based on theme context
- **Hydration Safe**: Prevents SSR/client mismatches
- **Color Harmony**: Tints complement existing color schemes
- **Contrast Preservation**: Maintains text readability

## Styling and Customization

### CSS Implementation Details
```css
/* Base parchment texture using layered gradients */
.parchment-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    /* Noise layer */
    radial-gradient(circle at 20% 80%, transparent 20%, rgba(120,80,40,0.1) 21%, rgba(120,80,40,0.1) 25%, transparent 26%),
    radial-gradient(circle at 80% 20%, transparent 20%, rgba(120,80,40,0.08) 21%, rgba(120,80,40,0.08) 25%, transparent 26%),
    radial-gradient(circle at 40% 40%, transparent 20%, rgba(120,80,40,0.06) 21%, rgba(120,80,40,0.06) 25%, transparent 26%),
    /* Base texture */
    linear-gradient(90deg, transparent 50%, rgba(120,80,40,0.03) 50%),
    linear-gradient(0deg, transparent 50%, rgba(120,80,40,0.03) 50%);
  background-size: 
    200px 200px,
    180px 180px,
    220px 220px,
    4px 4px,
    4px 4px;
  mix-blend-mode: multiply;
  opacity: var(--parchment-opacity);
  pointer-events: none;
}
```

### Tint Variations
```tsx
// Predefined tints
<ParchmentOverlay tint="warm" />    // Amber/sepia tones
<ParchmentOverlay tint="cool" />    // Blue/gray tones  
<ParchmentOverlay tint="neutral" /> // Balanced gray tones

// Custom color tints
<ParchmentOverlay tint="#8b4513" />           // Saddle brown
<ParchmentOverlay tint="rgb(139, 69, 19)" />  // RGB format
<ParchmentOverlay tint="hsl(25, 76%, 31%)" /> // HSL format
```

### Grain Intensity
```tsx
// Fine grain - subtle texture
<ParchmentOverlay grain="fine" />

// Medium grain - balanced texture (default)
<ParchmentOverlay grain="medium" />

// Coarse grain - pronounced texture
<ParchmentOverlay grain="coarse" />
```

### Opacity Control
```tsx
// Very subtle
<ParchmentOverlay opacity={0.05} />

// Light texture
<ParchmentOverlay opacity={0.1} />

// Standard texture
<ParchmentOverlay opacity={0.15} />

// Pronounced texture
<ParchmentOverlay opacity={0.25} />

// Heavy texture
<ParchmentOverlay opacity={0.4} />
```

## Accessibility Features

### Visual Accessibility
- **Contrast Preservation**: Texture doesn't interfere with text readability
- **Color Independence**: Purely decorative, doesn't convey information
- **Motion Respect**: Static texture respects motion preferences
- **High Contrast Mode**: Gracefully degrades in high contrast mode

### Screen Reader Compatibility
- **Decorative Only**: No semantic meaning, ignored by screen readers
- **Content Preservation**: Doesn't affect text selection or reading order
- **Focus Management**: Doesn't interfere with keyboard navigation

### Performance Accessibility
- **Reduced Motion**: Respects `prefers-reduced-motion` for animations
- **Battery Conscious**: Minimal GPU usage for mobile devices
- **Bandwidth Friendly**: No image downloads required

## Performance Considerations

### Rendering Optimization
- **CSS-Only**: No JavaScript execution overhead
- **GPU Acceleration**: Uses transform and opacity for hardware acceleration
- **Minimal Repaints**: Static positioning reduces layout thrashing
- **Efficient Blending**: Optimized blend mode usage

### Memory Efficiency
- **No Assets**: Eliminates image loading and caching
- **Minimal DOM**: Uses existing container and pseudo-elements
- **No Event Listeners**: Pure CSS implementation
- **Garbage Collection**: No memory leaks possible

### Bundle Impact
- **Tiny Footprint**: Minimal JavaScript code
- **CSS Inlining**: Can be inlined for critical path optimization
- **Tree Shaking**: Unused tint options are eliminated
- **Zero Dependencies**: No external library requirements

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

describe('ParchmentOverlay', () => {
  it('should render with default props', () => {
    render(
      <div data-testid="container">
        <ParchmentOverlay>
          <div>Test content</div>
        </ParchmentOverlay>
      </div>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply custom opacity', () => {
    render(
      <div data-testid="container">
        <ParchmentOverlay opacity={0.5}>
          <div>Content</div>
        </ParchmentOverlay>
      </div>
    );
    
    const overlay = screen.getByTestId('container').firstChild;
    expect(overlay).toHaveStyle({
      '--parchment-opacity': '0.5'
    });
  });

  it('should apply custom tint color', () => {
    render(
      <div data-testid="container">
        <ParchmentOverlay tint="#ff0000">
          <div>Content</div>
        </ParchmentOverlay>
      </div>
    );
    
    const overlay = screen.getByTestId('container').firstChild;
    expect(overlay).toHaveStyle({
      '--parchment-tint': '#ff0000'
    });
  });

  it('should apply grain class', () => {
    render(
      <div data-testid="container">
        <ParchmentOverlay grain="coarse">
          <div>Content</div>
        </ParchmentOverlay>
      </div>
    );
    
    const overlay = screen.getByTestId('container').firstChild;
    expect(overlay).toHaveClass('parchment-grain-coarse');
  });
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('parchment overlay visual test', async ({ page }) => {
  await page.goto('/parchment-test');
  
  // Test different grain levels
  await expect(page.locator('[data-testid="fine-grain"]')).toHaveScreenshot('parchment-fine.png');
  await expect(page.locator('[data-testid="medium-grain"]')).toHaveScreenshot('parchment-medium.png');
  await expect(page.locator('[data-testid="coarse-grain"]')).toHaveScreenshot('parchment-coarse.png');
  
  // Test different tints
  await expect(page.locator('[data-testid="warm-tint"]')).toHaveScreenshot('parchment-warm.png');
  await expect(page.locator('[data-testid="cool-tint"]')).toHaveScreenshot('parchment-cool.png');
  await expect(page.locator('[data-testid="neutral-tint"]')).toHaveScreenshot('parchment-neutral.png');
});
```

### Accessibility Tests

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

expect.extend(toHaveNoViolations);

describe('ParchmentOverlay Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <div>
        <ParchmentOverlay>
          <h2>Accessible Content</h2>
          <p>This content should remain fully accessible with parchment overlay.</p>
        </ParchmentOverlay>
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should maintain text contrast', async () => {
    const { container } = render(
      <div style={{ backgroundColor: '#fff', color: '#000' }}>
        <ParchmentOverlay opacity={0.3}>
          <p>High contrast text</p>
        </ParchmentOverlay>
      </div>
    );
    
    // Test would verify contrast ratios remain above WCAG thresholds
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Common Patterns

### Card Enhancement
```tsx
// Enhanced card with parchment texture
export function ParchmentCard({ title, children, ...props }) {
  return (
    <div className="relative p-6 bg-amber-50 rounded-lg border shadow-sm" {...props}>
      <ParchmentOverlay opacity={0.15} tint="warm" />
      <div className="relative z-10">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}
```

### Section Background
```tsx
// Full-width section with parchment
export function ParchmentSection({ children }) {
  return (
    <section className="relative py-16 bg-gradient-to-br from-amber-50 to-amber-100">
      <ParchmentOverlay opacity={0.2} grain="coarse" />
      <div className="container mx-auto px-4 relative z-10">
        {children}
      </div>
    </section>
  );
}
```

### Modal Enhancement
```tsx
// Parchment-textured modal
export function ParchmentModal({ isOpen, onClose, children }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="relative bg-amber-50">
        <ParchmentOverlay opacity={0.12} tint="warm" grain="fine" />
        <div className="relative z-10">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with CSS gradients and blend modes
- **Safari**: Excellent support including mobile Safari
- **Firefox**: Full support with hardware acceleration
- **Chrome/Edge**: Optimal performance with GPU acceleration
- **Fallbacks**: Graceful degradation to solid color overlay

## Related Components

- **HeroBackdrop**: Background image component
- **OrnateCorners**: Decorative corner elements
- **ClassicalIcon**: Icon components for themed content
- **Card**: Base card component for enhancement

## Migration Guide

### From Image-Based Textures

```css
/* Before: Image texture */
.textured-background {
  background-image: url('/textures/parchment.png');
  background-repeat: repeat;
  background-size: 200px 200px;
}
```

```tsx
// After: ParchmentOverlay component
<div className="relative bg-amber-50">
  <ParchmentOverlay opacity={0.15} grain="medium" />
  {/* Content */}
</div>
```

### From CSS Noise Filters

```css
/* Before: CSS filter noise */
.noisy-background {
  background: #f5f5dc;
  filter: contrast(170%) brightness(1000%);
}

.noisy-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256'...");
  opacity: 0.4;
  mix-blend-mode: multiply;
}
```

```tsx
// After: ParchmentOverlay component
<div className="relative bg-amber-50">
  <ParchmentOverlay opacity={0.2} tint="warm" grain="medium" />
  {/* Content */}
</div>
```