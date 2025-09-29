# ClassicalIcon Component

## Overview

The `ClassicalIcon` component is a sophisticated icon system designed for the classical Renaissance theme of Sunsteel. It renders monochrome SVG icons using CSS masks, allowing them to inherit the current text color and integrate seamlessly with the design system. The component provides a curated collection of classical and fitness-themed icons that maintain visual consistency across the application.

## Import

```typescript
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import type { ClassicalIconName } from '@/components/icons/ClassicalIcon';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `ClassicalIconName` | - | **Required.** Name of the icon to display |
| `className` | `string` | - | Additional CSS classes for styling |
| `title` | `string` | - | Accessible title for screen readers (sets `aria-label` and `title`) |
| `aria-hidden` | `boolean \| 'true' \| 'false'` | - | Hide icon from screen readers when decorative |
| `style` | `React.CSSProperties` | - | Inline styles for the icon |

## Available Icons

The component supports the following classical and fitness-themed icons:

### Fitness & Training Icons
- `bicep-flexing` - Flexed bicep muscle
- `dumbbell` - Single dumbbell
- `two-dumbbells` - Crossed dumbbells

### Classical & Decorative Icons
- `coin` - Ancient coin
- `compass` - Navigation compass
- `crown` - Royal crown
- `crested-helmet` - Classical warrior helmet
- `eight-pointed-star` - Decorative star
- `hourglass` - Time hourglass
- `laurel-crown` - Victory laurel crown
- `laurel-wreath` - Circular laurel wreath
- `lyre` - Classical musical instrument
- `olive` - Olive branch (peace symbol)
- `pillar-icon` - Classical column
- `scroll-unfurled` - Ancient scroll
- `shield` - Warrior shield
- `torch` - Olympic torch
- `vertical-banner` - Ceremonial banner

## Usage Examples

### Basic Usage

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function BasicIconExample() {
  return (
    <div className="flex items-center gap-4">
      <ClassicalIcon name="dumbbell" className="w-6 h-6" />
      <span>Strength Training</span>
    </div>
  );
}
```

### Icon Gallery

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function IconGallery() {
  const fitnessIcons = ['bicep-flexing', 'dumbbell', 'two-dumbbells'] as const;
  const classicalIcons = ['crown', 'laurel-crown', 'shield', 'torch'] as const;
  
  return (
    <div className="space-y-8">
      {/* Fitness Icons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Fitness Icons</h3>
        <div className="flex gap-4">
          {fitnessIcons.map((icon) => (
            <div key={icon} className="flex flex-col items-center gap-2">
              <ClassicalIcon 
                name={icon} 
                className="w-8 h-8 text-amber-600" 
                title={icon}
              />
              <span className="text-sm text-gray-600">{icon}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Classical Icons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Classical Icons</h3>
        <div className="flex gap-4">
          {classicalIcons.map((icon) => (
            <div key={icon} className="flex flex-col items-center gap-2">
              <ClassicalIcon 
                name={icon} 
                className="w-8 h-8 text-amber-600" 
                title={icon}
              />
              <span className="text-sm text-gray-600">{icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Different Sizes

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function IconSizes() {
  return (
    <div className="flex items-center gap-6">
      {/* Small */}
      <ClassicalIcon 
        name="shield" 
        className="w-4 h-4 text-amber-600" 
        title="Small shield"
      />
      
      {/* Medium */}
      <ClassicalIcon 
        name="shield" 
        className="w-6 h-6 text-amber-600" 
        title="Medium shield"
      />
      
      {/* Large */}
      <ClassicalIcon 
        name="shield" 
        className="w-8 h-8 text-amber-600" 
        title="Large shield"
      />
      
      {/* Extra Large */}
      <ClassicalIcon 
        name="shield" 
        className="w-12 h-12 text-amber-600" 
        title="Extra large shield"
      />
    </div>
  );
}
```

### Color Variations

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function ColoredIcons() {
  return (
    <div className="flex gap-4">
      {/* Inherits text color */}
      <div className="text-amber-600">
        <ClassicalIcon name="crown" className="w-8 h-8" />
      </div>
      
      {/* Custom colors via className */}
      <ClassicalIcon name="laurel-crown" className="w-8 h-8 text-green-600" />
      <ClassicalIcon name="torch" className="w-8 h-8 text-orange-500" />
      <ClassicalIcon name="shield" className="w-8 h-8 text-blue-600" />
      
      {/* Gradient colors */}
      <ClassicalIcon 
        name="coin" 
        className="w-8 h-8"
        style={{ 
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }}
      />
    </div>
  );
}
```

### Navigation and UI Integration

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import { Button } from '@/components/ui/button';

export function NavigationWithIcons() {
  return (
    <nav className="flex gap-4">
      <Button variant="ghost" className="flex items-center gap-2">
        <ClassicalIcon name="dumbbell" className="w-5 h-5" />
        Workouts
      </Button>
      
      <Button variant="ghost" className="flex items-center gap-2">
        <ClassicalIcon name="scroll-unfurled" className="w-5 h-5" />
        Programs
      </Button>
      
      <Button variant="ghost" className="flex items-center gap-2">
        <ClassicalIcon name="laurel-crown" className="w-5 h-5" />
        Achievements
      </Button>
      
      <Button variant="ghost" className="flex items-center gap-2">
        <ClassicalIcon name="compass" className="w-5 h-5" />
        Progress
      </Button>
    </nav>
  );
}
```

### Card Headers and Decorative Elements

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function DecorativeCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Strength Card */}
      <div className="p-6 bg-amber-50 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <ClassicalIcon 
            name="bicep-flexing" 
            className="w-8 h-8 text-amber-600" 
            title="Strength training"
          />
          <h3 className="text-xl font-bold text-amber-900">Strength</h3>
        </div>
        <p className="text-amber-800">
          Build raw power through progressive overload and compound movements.
        </p>
      </div>
      
      {/* Endurance Card */}
      <div className="p-6 bg-blue-50 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <ClassicalIcon 
            name="torch" 
            className="w-8 h-8 text-blue-600" 
            title="Endurance training"
          />
          <h3 className="text-xl font-bold text-blue-900">Endurance</h3>
        </div>
        <p className="text-blue-800">
          Develop cardiovascular fitness and muscular endurance.
        </p>
      </div>
      
      {/* Achievement Card */}
      <div className="p-6 bg-green-50 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <ClassicalIcon 
            name="laurel-wreath" 
            className="w-8 h-8 text-green-600" 
            title="Achievements"
          />
          <h3 className="text-xl font-bold text-green-900">Victory</h3>
        </div>
        <p className="text-green-800">
          Celebrate milestones and track your progress over time.
        </p>
      </div>
    </div>
  );
}
```

### Status Indicators

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function StatusIndicators() {
  return (
    <div className="space-y-4">
      {/* Success Status */}
      <div className="flex items-center gap-2 text-green-600">
        <ClassicalIcon name="laurel-crown" className="w-5 h-5" />
        <span>Workout completed successfully</span>
      </div>
      
      {/* In Progress */}
      <div className="flex items-center gap-2 text-amber-600">
        <ClassicalIcon name="hourglass" className="w-5 h-5" />
        <span>Training session in progress</span>
      </div>
      
      {/* Achievement Unlocked */}
      <div className="flex items-center gap-2 text-purple-600">
        <ClassicalIcon name="eight-pointed-star" className="w-5 h-5" />
        <span>New achievement unlocked</span>
      </div>
      
      {/* Protected Content */}
      <div className="flex items-center gap-2 text-blue-600">
        <ClassicalIcon name="shield" className="w-5 h-5" />
        <span>Premium feature</span>
      </div>
    </div>
  );
}
```

### Loading and Empty States

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function EmptyStates() {
  return (
    <div className="space-y-8">
      {/* No Workouts */}
      <div className="text-center py-12">
        <ClassicalIcon 
          name="dumbbell" 
          className="w-16 h-16 text-gray-400 mx-auto mb-4" 
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No workouts yet
        </h3>
        <p className="text-gray-600">
          Start your fitness journey by creating your first workout routine.
        </p>
      </div>
      
      {/* No Achievements */}
      <div className="text-center py-12">
        <ClassicalIcon 
          name="laurel-wreath" 
          className="w-16 h-16 text-gray-400 mx-auto mb-4" 
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No achievements unlocked
        </h3>
        <p className="text-gray-600">
          Complete workouts and reach milestones to earn achievements.
        </p>
      </div>
    </div>
  );
}
```

### Animated Icons

```tsx
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export function AnimatedIcons() {
  return (
    <div className="flex gap-6">
      {/* Pulse animation */}
      <ClassicalIcon 
        name="torch" 
        className="w-8 h-8 text-orange-500 animate-pulse" 
        title="Active session"
      />
      
      {/* Spin animation */}
      <ClassicalIcon 
        name="compass" 
        className="w-8 h-8 text-blue-500 animate-spin" 
        title="Loading"
      />
      
      {/* Bounce animation */}
      <ClassicalIcon 
        name="coin" 
        className="w-8 h-8 text-yellow-500 animate-bounce" 
        title="Reward earned"
      />
      
      {/* Custom animation */}
      <ClassicalIcon 
        name="laurel-crown" 
        className="w-8 h-8 text-green-500 hover:scale-110 transition-transform duration-200" 
        title="Achievement"
      />
    </div>
  );
}
```

## Features

### CSS Mask Implementation
- **Color Inheritance**: Icons inherit `currentColor` from parent elements
- **Vector Quality**: SVG-based icons maintain crisp edges at any size
- **Performance**: CSS masks are hardware-accelerated
- **Flexibility**: Easy to style with CSS classes and properties

### Accessibility Features
- **Screen Reader Support**: Proper `role` and `aria-label` attributes
- **Semantic HTML**: Uses appropriate HTML elements for context
- **Keyboard Navigation**: Compatible with focus management
- **High Contrast**: Works with high contrast mode and custom themes

### Theme Integration
- **Color Harmony**: Inherits theme colors automatically
- **Consistent Sizing**: Works with design system spacing
- **Dark Mode**: Automatically adapts to theme changes
- **Custom Styling**: Easy to override with Tailwind classes

## Styling and Customization

### Size Classes
```tsx
// Tailwind size utilities
<ClassicalIcon name="shield" className="w-4 h-4" />   // 16px
<ClassicalIcon name="shield" className="w-5 h-5" />   // 20px
<ClassicalIcon name="shield" className="w-6 h-6" />   // 24px
<ClassicalIcon name="shield" className="w-8 h-8" />   // 32px
<ClassicalIcon name="shield" className="w-12 h-12" /> // 48px
<ClassicalIcon name="shield" className="w-16 h-16" /> // 64px
```

### Color Classes
```tsx
// Theme colors
<ClassicalIcon name="crown" className="text-primary" />
<ClassicalIcon name="crown" className="text-secondary" />
<ClassicalIcon name="crown" className="text-muted-foreground" />

// Specific colors
<ClassicalIcon name="crown" className="text-amber-600" />
<ClassicalIcon name="crown" className="text-blue-500" />
<ClassicalIcon name="crown" className="text-green-600" />
```

### Custom Styling
```tsx
// Custom CSS properties
<ClassicalIcon 
  name="torch"
  style={{
    width: '2rem',
    height: '2rem',
    color: '#ff6b35',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
  }}
/>

// CSS-in-JS styling
<ClassicalIcon 
  name="coin"
  className="w-8 h-8"
  style={{
    background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  }}
/>
```

### Responsive Sizing
```tsx
// Responsive icon sizes
<ClassicalIcon 
  name="dumbbell" 
  className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" 
/>
```

## Accessibility Features

### Screen Reader Support
- **Semantic Roles**: Uses `role="img"` when title is provided
- **Descriptive Labels**: `aria-label` and `title` for context
- **Decorative Hiding**: `aria-hidden="true"` for decorative icons
- **Meaningful Names**: Icon names reflect their visual meaning

### Keyboard Navigation
- **Focus Management**: Icons don't interfere with tab order
- **Interactive Context**: Works properly within buttons and links
- **Focus Indicators**: Compatible with custom focus styles

### Visual Accessibility
- **High Contrast**: Works with high contrast mode
- **Color Independence**: Meaning not conveyed through color alone
- **Scalable**: Maintains clarity when zoomed to 200%
- **Motion Respect**: Static by default, respects motion preferences

## Performance Considerations

### Rendering Optimization
- **CSS Masks**: Hardware-accelerated rendering
- **SVG Assets**: Cached by browser after first load
- **Minimal DOM**: Single `span` element per icon
- **No JavaScript**: Pure CSS implementation after initial render

### Bundle Impact
- **Small Component**: Minimal JavaScript footprint
- **Type Safety**: TypeScript ensures valid icon names
- **Tree Shaking**: Unused icons don't affect bundle size
- **Asset Optimization**: SVG files can be optimized and compressed

### Loading Performance
- **Asset Preloading**: Critical icons can be preloaded
- **Caching**: SVG files cached by browser
- **Lazy Loading**: Non-critical icons load on demand
- **CDN Friendly**: SVG assets work well with CDNs

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

describe('ClassicalIcon', () => {
  it('should render with correct mask image', () => {
    render(<ClassicalIcon name="shield" data-testid="icon" />);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveStyle({
      maskImage: 'url(/icons/classical/shield.svg)',
      WebkitMaskImage: 'url(/icons/classical/shield.svg)',
    });
  });

  it('should apply custom className', () => {
    render(<ClassicalIcon name="crown" className="w-8 h-8 text-amber-600" />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('w-8', 'h-8', 'text-amber-600');
  });

  it('should set accessibility attributes when title provided', () => {
    render(<ClassicalIcon name="torch" title="Olympic torch" />);
    
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('aria-label', 'Olympic torch');
    expect(icon).toHaveAttribute('title', 'Olympic torch');
  });

  it('should hide from screen readers when aria-hidden is true', () => {
    render(<ClassicalIcon name="coin" aria-hidden="true" />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
```

### Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test('classical icons visual test', async ({ page }) => {
  await page.goto('/icon-gallery');
  
  // Test icon rendering
  await expect(page.locator('[data-testid="icon-gallery"]')).toHaveScreenshot('icon-gallery.png');
  
  // Test different sizes
  await expect(page.locator('[data-testid="icon-sizes"]')).toHaveScreenshot('icon-sizes.png');
  
  // Test color variations
  await expect(page.locator('[data-testid="icon-colors"]')).toHaveScreenshot('icon-colors.png');
});
```

### Accessibility Tests

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

expect.extend(toHaveNoViolations);

describe('ClassicalIcon Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <div>
        <ClassicalIcon name="shield" title="Protection" />
        <ClassicalIcon name="torch" aria-hidden="true" />
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Common Patterns

### Icon Button Component
```tsx
import { ClassicalIcon, ClassicalIconName } from '@/components/icons/ClassicalIcon';
import { Button } from '@/components/ui/button';

interface IconButtonProps {
  icon: ClassicalIconName;
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline';
}

export function IconButton({ icon, children, variant = 'default' }: IconButtonProps) {
  return (
    <Button variant={variant} className="flex items-center gap-2">
      <ClassicalIcon name={icon} className="w-4 h-4" />
      {children}
    </Button>
  );
}
```

### Status Badge Component
```tsx
import { ClassicalIcon, ClassicalIconName } from '@/components/icons/ClassicalIcon';

interface StatusBadgeProps {
  icon: ClassicalIconName;
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export function StatusBadge({ icon, status, children }: StatusBadgeProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50',
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColors[status]}`}>
      <ClassicalIcon name={icon} className="w-4 h-4" />
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}
```

### Feature Card Component
```tsx
import { ClassicalIcon, ClassicalIconName } from '@/components/icons/ClassicalIcon';

interface FeatureCardProps {
  icon: ClassicalIconName;
  title: string;
  description: string;
  color?: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  color = 'text-amber-600' 
}: FeatureCardProps) {
  return (
    <div className="p-6 bg-card rounded-lg border">
      <ClassicalIcon 
        name={icon} 
        className={`w-12 h-12 ${color} mb-4`}
        title={title}
      />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support with CSS masks
- **Safari**: Excellent support including mobile Safari
- **Firefox**: Full support with hardware acceleration
- **Chrome/Edge**: Optimal performance with GPU acceleration
- **Fallbacks**: Graceful degradation to background color

## Related Components

- **Button**: UI component that commonly uses icons
- **Badge**: Status component enhanced with icons
- **Card**: Layout component for icon-based content
- **Navigation**: Menu components using icons

## Migration Guide

### From Font Icons

```css
/* Before: Font icons */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}
```

```html
<!-- Before: Font icon -->
<i class="material-icons">fitness_center</i>
```

```tsx
// After: ClassicalIcon component
<ClassicalIcon name="dumbbell" className="w-6 h-6" />
```

### From SVG Imports

```tsx
// Before: Direct SVG import
import ShieldIcon from '@/assets/icons/shield.svg';

function Component() {
  return <ShieldIcon className="w-6 h-6 text-blue-600" />;
}
```

```tsx
// After: ClassicalIcon component
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

function Component() {
  return <ClassicalIcon name="shield" className="w-6 h-6 text-blue-600" />;
}
```

### Adding New Icons

1. **Add SVG File**: Place the SVG file in `/public/icons/classical/`
2. **Update Type**: Add the icon name to `ClassicalIconName` type
3. **Optimize SVG**: Ensure the SVG is optimized and monochrome
4. **Test**: Verify the icon renders correctly with CSS masks

```typescript
// Update the type definition
export type ClassicalIconName =
  | 'existing-icon'
  | 'new-icon-name' // Add new icon here
  | 'another-icon';
```