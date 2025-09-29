# OrnateCorners Component

## Overview

The `OrnateCorners` component is a decorative CSS-only component that adds elegant L-shaped ornamental borders to each corner of its container. Designed with the classical Renaissance theme in mind, it creates sophisticated visual framing for content areas, cards, and sections. The component is highly customizable and performance-optimized with pure CSS implementation.

## Import

```typescript
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `'#d4af37'` | Color of the ornamental corners (supports CSS color values) |
| `thickness` | `number` | `2` | Thickness of the corner lines in pixels |
| `length` | `number` | `24` | Length of each corner arm in pixels |
| `radius` | `number` | `4` | Border radius for subtle corner curvature in pixels |
| `inset` | `number` | `16` | Distance from container edges in pixels |
| `className` | `string` | - | Additional CSS classes for the container |
| `style` | `React.CSSProperties` | - | Inline styles for the container |
| `children` | `React.ReactNode` | - | Content to display within the ornate frame |

## Usage Examples

### Basic Usage

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

export function DecoratedCard() {
  return (
    <div className="relative p-8 bg-amber-50 rounded-lg">
      <OrnateCorners />
      <h2 className="text-2xl font-bold text-center mb-4">
        Classical Training
      </h2>
      <p className="text-gray-700">
        Embrace the timeless principles of strength and discipline.
      </p>
    </div>
  );
}
```

### Custom Styling

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

export function CustomOrnateFrame() {
  return (
    <div className="relative p-12 bg-gradient-to-br from-amber-100 to-amber-200">
      <OrnateCorners 
        color="#8b4513"
        thickness={3}
        length={32}
        radius={6}
        inset={20}
      />
      <div className="text-center">
        <h1 className="text-4xl font-black text-amber-900 mb-6">
          STRENGTH FORGE
        </h1>
        <p className="text-lg text-amber-800">
          Where legends are born through dedication
        </p>
      </div>
    </div>
  );
}
```

### Multiple Nested Frames

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

export function NestedOrnateFrames() {
  return (
    <div className="relative p-16 bg-amber-900 rounded-xl">
      {/* Outer frame */}
      <OrnateCorners 
        color="#ffd700"
        thickness={3}
        length={40}
        inset={24}
      />
      
      <div className="relative p-8 bg-amber-100 rounded-lg">
        {/* Inner frame */}
        <OrnateCorners 
          color="#8b4513"
          thickness={2}
          length={24}
          inset={16}
        />
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-amber-900 mb-4">
            Elite Training
          </h2>
          <p className="text-amber-800">
            Advanced techniques for serious athletes
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Theme-Aware Colors

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';
import { useTheme } from 'next-themes';

export function ThemedOrnateFrame() {
  const { theme } = useTheme();
  
  const cornerColor = theme === 'dark' ? '#ffd700' : '#8b4513';
  
  return (
    <div className="relative p-8 bg-card rounded-lg border">
      <OrnateCorners 
        color={cornerColor}
        thickness={2}
        length={28}
        inset={16}
      />
      <h3 className="text-xl font-semibold mb-3">
        Adaptive Design
      </h3>
      <p className="text-muted-foreground">
        Ornate corners that adapt to your theme preference.
      </p>
    </div>
  );
}
```

### Responsive Ornate Frames

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

export function ResponsiveOrnateFrame() {
  return (
    <div className="relative p-4 md:p-8 lg:p-12 bg-amber-50 rounded-lg">
      <OrnateCorners 
        color="#d4af37"
        thickness={2}
        length={20}
        inset={12}
        className="md:hidden" // Small screens
      />
      <OrnateCorners 
        color="#d4af37"
        thickness={3}
        length={28}
        inset={16}
        className="hidden md:block lg:hidden" // Medium screens
      />
      <OrnateCorners 
        color="#d4af37"
        thickness={4}
        length={36}
        inset={24}
        className="hidden lg:block" // Large screens
      />
      
      <div className="text-center">
        <h2 className="text-lg md:text-2xl lg:text-3xl font-bold mb-4">
          Responsive Elegance
        </h2>
        <p className="text-sm md:text-base lg:text-lg text-gray-700">
          Ornate frames that scale beautifully across devices.
        </p>
      </div>
    </div>
  );
}
```

### Interactive Hover Effects

```tsx
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';
import { useState } from 'react';

export function InteractiveOrnateCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative p-8 bg-amber-50 rounded-lg cursor-pointer transition-all duration-300 hover:bg-amber-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <OrnateCorners 
        color={isHovered ? '#ffd700' : '#d4af37'}
        thickness={isHovered ? 3 : 2}
        length={isHovered ? 32 : 24}
        inset={16}
        style={{
          transition: 'all 0.3s ease',
        }}
      />
      
      <h3 className="text-xl font-semibold mb-3">
        Interactive Frame
      </h3>
      <p className="text-gray-700">
        Hover to see the ornate corners come alive with animation.
      </p>
    </div>
  );
}
```

## Features

### Pure CSS Implementation
- **Zero JavaScript**: Entirely CSS-based for optimal performance
- **Hardware Acceleration**: Uses CSS transforms and pseudo-elements
- **Minimal DOM**: No additional HTML elements required
- **Efficient Rendering**: Leverages browser's native rendering optimizations

### Customization Options
- **Color Control**: Any CSS color value (hex, rgb, hsl, named colors)
- **Size Flexibility**: Adjustable thickness, length, and positioning
- **Border Radius**: Subtle curvature for modern classical aesthetics
- **Positioning**: Configurable inset distance from container edges

### Responsive Design
- **Scalable**: Works with any container size
- **Breakpoint Friendly**: Easy to customize per screen size
- **Flexible Layout**: Adapts to content changes automatically
- **Container Agnostic**: Works with any parent element

## Styling and Customization

### CSS Implementation Details
```css
/* The component uses CSS pseudo-elements for each corner */
.ornate-corners::before,
.ornate-corners::after,
.ornate-corners > *::before,
.ornate-corners > *::after {
  content: '';
  position: absolute;
  border-style: solid;
  border-color: var(--corner-color);
  border-radius: var(--corner-radius);
}

/* Top-left corner */
.ornate-corners::before {
  top: var(--inset);
  left: var(--inset);
  border-width: var(--thickness) 0 0 var(--thickness);
  width: var(--length);
  height: var(--length);
}

/* Top-right corner */
.ornate-corners::after {
  top: var(--inset);
  right: var(--inset);
  border-width: var(--thickness) var(--thickness) 0 0;
  width: var(--length);
  height: var(--length);
}

/* Bottom corners use nested pseudo-elements */
```

### Color Variations
```tsx
// Classical gold
<OrnateCorners color="#d4af37" />

// Bronze accent
<OrnateCorners color="#cd7f32" />

// Silver elegance
<OrnateCorners color="#c0c0c0" />

// Custom brand color
<OrnateCorners color="hsl(45, 100%, 50%)" />

// CSS variable
<OrnateCorners color="var(--accent-color)" />
```

### Size Variations
```tsx
// Subtle corners
<OrnateCorners thickness={1} length={16} inset={8} />

// Standard corners
<OrnateCorners thickness={2} length={24} inset={16} />

// Bold corners
<OrnateCorners thickness={4} length={40} inset={24} />

// Dramatic corners
<OrnateCorners thickness={6} length={60} inset={32} />
```

### Animation Integration
```tsx
// CSS transition support
<OrnateCorners 
  color="#d4af37"
  style={{
    transition: 'all 0.3s ease',
    '--corner-color': isActive ? '#ffd700' : '#d4af37',
  }}
/>
```

## Accessibility Features

### Screen Reader Compatibility
- **Decorative Only**: Purely visual enhancement, no semantic meaning
- **No Focus Trap**: Doesn't interfere with keyboard navigation
- **Content Preservation**: Doesn't affect text selection or reading order

### Visual Accessibility
- **High Contrast**: Configurable colors for sufficient contrast
- **Motion Respect**: Static by default, respects motion preferences
- **Color Independence**: Decorative only, doesn't convey information

### Keyboard Navigation
- **Transparent**: Doesn't interfere with tab order
- **Focus Indicators**: Compatible with focus ring styles
- **Interactive Elements**: Works with clickable containers

## Performance Considerations

### Rendering Optimization
- **CSS-Only**: No JavaScript execution overhead
- **Pseudo-Elements**: Efficient use of browser rendering
- **Hardware Acceleration**: Uses transform properties where possible
- **Minimal Repaints**: Static positioning reduces layout thrashing

### Memory Efficiency
- **No Event Listeners**: Pure CSS implementation
- **Minimal DOM**: Uses existing container element
- **No State Management**: Stateless component design
- **Garbage Collection**: No memory leaks possible

### Bundle Impact
- **Tiny Footprint**: Minimal JavaScript code
- **CSS Inlining**: Styles can be inlined for critical path
- **Tree Shaking**: Unused props are eliminated
- **Zero Dependencies**: No external library requirements

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

describe('OrnateCorners', () => {
  it('should render with default props', () => {
    render(
      <div data-testid="container">
        <OrnateCorners>
          <div>Test content</div>
        </OrnateCorners>
      </div>
    );
    
    const container = screen.getByTestId('container');
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply custom color', () => {
    render(
      <div data-testid="container">
        <OrnateCorners color="#ff0000">
          <div>Content</div>
        </OrnateCorners>
      </div>
    );
    
    const ornateElement = screen.getByTestId('container').firstChild;
    expect(ornateElement).toHaveStyle({
      '--corner-color': '#ff0000'
    });
  });

  it('should apply custom dimensions', () => {
    render(
      <div data-testid="container">
        <OrnateCorners thickness={5} length={30} inset={20}>
          <div>Content</div>
        </OrnateCorners>
      </div>
    );
    
    const ornateElement = screen.getByTestId('container').firstChild;
    expect(ornateElement).toHaveStyle({
      '--thickness': '5px',
      '--length': '30px',
      '--inset': '20px'
    });
  });
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('ornate corners visual test', async ({ page }) => {
  await page.goto('/ornate-corners-test');
  
  // Test default appearance
  await expect(page.locator('[data-testid="default-corners"]')).toHaveScreenshot('default-corners.png');
  
  // Test custom styling
  await expect(page.locator('[data-testid="custom-corners"]')).toHaveScreenshot('custom-corners.png');
  
  // Test responsive behavior
  await page.setViewportSize({ width: 768, height: 600 });
  await expect(page.locator('[data-testid="responsive-corners"]')).toHaveScreenshot('responsive-corners.png');
});
```

### Accessibility Tests

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OrnateCorners } from '@/components/backgrounds/OrnateCorners';

expect.extend(toHaveNoViolations);

describe('OrnateCorners Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <div>
        <OrnateCorners>
          <h2>Accessible Content</h2>
          <p>This content should remain fully accessible.</p>
        </OrnateCorners>
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Common Patterns

### Card Enhancement
```tsx
// Enhanced card with ornate frame
export function OrnateCard({ title, children, ...props }) {
  return (
    <div className="relative p-6 bg-card rounded-lg border shadow-sm" {...props}>
      <OrnateCorners />
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
```

### Section Dividers
```tsx
// Ornate section separator
export function OrnateSection({ title, children }) {
  return (
    <section className="relative py-12">
      <div className="relative p-8 bg-amber-50/50 rounded-lg">
        <OrnateCorners color="#d4af37" inset={12} />
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        {children}
      </div>
    </section>
  );
}
```

### Modal Enhancement
```tsx
// Ornate modal dialog
export function OrnateModal({ isOpen, onClose, children }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="relative max-w-md">
        <OrnateCorners color="#d4af37" thickness={2} length={20} />
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with CSS pseudo-elements
- **IE11+**: Supported with minor visual differences
- **Mobile Browsers**: Excellent performance on touch devices
- **Print Styles**: Renders correctly in print media

## Related Components

- **HeroBackdrop**: Background image component
- **ParchmentOverlay**: Texture overlay component
- **ClassicalIcon**: Decorative icon elements
- **Card**: Base card component for enhancement

## Migration Guide

### From Border-Based Decorations

```css
/* Before: CSS borders */
.decorated-box {
  border: 2px solid #d4af37;
  border-radius: 8px;
  position: relative;
}

.decorated-box::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 1px solid #d4af37;
  border-radius: 12px;
}
```

```tsx
// After: OrnateCorners component
<div className="relative p-6 bg-card rounded-lg">
  <OrnateCorners color="#d4af37" thickness={2} length={24} />
  {/* Content */}
</div>
```

### From Image-Based Corners

```html
<!-- Before: Image corners -->
<div class="corner-container">
  <img src="/corner-tl.png" class="corner corner-tl" />
  <img src="/corner-tr.png" class="corner corner-tr" />
  <img src="/corner-bl.png" class="corner corner-bl" />
  <img src="/corner-br.png" class="corner corner-br" />
  <div class="content">...</div>
</div>
```

```tsx
// After: OrnateCorners component
<div className="relative p-6">
  <OrnateCorners />
  <div>{/* Content */}</div>
</div>
```