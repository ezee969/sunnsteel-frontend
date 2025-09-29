# InfoTooltip Component

## Overview

The `InfoTooltip` component is a custom wrapper around the shadcn/ui Tooltip component that provides a standardized information icon with tooltip functionality. It's designed to display helpful information or explanations for UI elements in a consistent, accessible manner.

## Import

```typescript
import { InfoTooltip } from '@/components/InfoTooltip';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | - | The text content to display in the tooltip |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'right'` | The side where the tooltip should appear relative to the trigger |

## Usage Examples

### Basic Usage

```tsx
import { InfoTooltip } from '@/components/InfoTooltip';

export function MyComponent() {
  return (
    <div className="flex items-center gap-2">
      <label>Training Max</label>
      <InfoTooltip content="Your training max is 90% of your 1RM" />
    </div>
  );
}
```

### Different Positioning

```tsx
import { InfoTooltip } from '@/components/InfoTooltip';

export function PositionedTooltips() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label>Top Tooltip</label>
        <InfoTooltip 
          content="This tooltip appears above the icon" 
          side="top" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label>Bottom Tooltip</label>
        <InfoTooltip 
          content="This tooltip appears below the icon" 
          side="bottom" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label>Left Tooltip</label>
        <InfoTooltip 
          content="This tooltip appears to the left of the icon" 
          side="left" 
        />
      </div>
    </div>
  );
}
```

### In Form Fields

```tsx
import { InfoTooltip } from '@/components/InfoTooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FormWithTooltips() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="reps">Target Reps</Label>
          <InfoTooltip 
            content="The number of repetitions you aim to complete for each set"
            side="right"
          />
        </div>
        <Input id="reps" type="number" placeholder="8-12" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="weight">Weight (lbs)</Label>
          <InfoTooltip 
            content="Enter the weight you plan to lift. Use increments of 2.5 or 5 lbs"
            side="right"
          />
        </div>
        <Input id="weight" type="number" placeholder="135" />
      </div>
    </div>
  );
}
```

### Long Content

```tsx
import { InfoTooltip } from '@/components/InfoTooltip';

export function LongContentTooltip() {
  return (
    <div className="flex items-center gap-2">
      <label>RPE Scale</label>
      <InfoTooltip 
        content="Rate of Perceived Exertion (RPE) is a scale from 1-10 that measures how difficult an exercise feels. 10 means maximum effort with no reps left in reserve, while 8 means you could do 2 more reps."
        side="top"
      />
    </div>
  );
}
```

## Styling and Customization

### Default Styling
The component uses consistent styling that integrates with the application's design system:

- **Icon**: Uses the `Info` icon from Lucide React
- **Size**: 16px (w-4 h-4) container with 12px (w-3 h-3) icon
- **Colors**: Uses theme-aware colors (`text-muted-foreground`, `hover:bg-accent`)
- **Tooltip**: Maximum width of `max-w-xs` (20rem) for content wrapping

### Hover States
- Subtle background color change on hover
- Smooth transition animations
- Maintains accessibility focus indicators

## Accessibility Features

### Keyboard Navigation
- Fully keyboard accessible through the underlying Tooltip component
- Focus management handled automatically
- Supports `Tab` navigation

### Screen Reader Support
- Tooltip content is properly announced by screen readers
- Uses semantic button element for the trigger
- Maintains proper focus order

### ARIA Attributes
- Inherits ARIA attributes from the shadcn/ui Tooltip component
- Proper `aria-describedby` relationships
- Accessible button role for the trigger

## Performance Considerations

### Lightweight Implementation
- Minimal component overhead
- Uses existing Tooltip infrastructure
- No additional JavaScript bundle impact

### Rendering Optimization
- Simple functional component with no internal state
- Efficient re-rendering due to minimal props
- Leverages React's built-in optimizations

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InfoTooltip } from '@/components/InfoTooltip';

describe('InfoTooltip', () => {
  it('should render info icon', () => {
    render(<InfoTooltip content="Test tooltip" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show tooltip content on hover', async () => {
    render(<InfoTooltip content="Test tooltip content" />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });
  });

  it('should position tooltip correctly', async () => {
    render(<InfoTooltip content="Test" side="top" />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-side', 'top');
    });
  });
});
```

### Accessibility Tests

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { InfoTooltip } from '@/components/InfoTooltip';

expect.extend(toHaveNoViolations);

describe('InfoTooltip Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <InfoTooltip content="Accessible tooltip" />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Common Patterns

### Form Field Helper
```tsx
// Reusable pattern for form fields with help text
export function FormFieldWithHelp({ 
  label, 
  helpText, 
  children 
}: {
  label: string;
  helpText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <InfoTooltip content={helpText} />
      </div>
      {children}
    </div>
  );
}
```

### Conditional Tooltip
```tsx
// Show tooltip only when help text is available
export function ConditionalInfoTooltip({ 
  helpText, 
  side = 'right' 
}: {
  helpText?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  if (!helpText) return null;
  
  return <InfoTooltip content={helpText} side={side} />;
}
```

## Browser Support

- **Modern Browsers**: Full support in Chrome, Firefox, Safari, Edge
- **Mobile**: Touch-friendly interaction on mobile devices
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Readers**: Compatible with NVDA, JAWS, VoiceOver

## Related Components

- **Tooltip**: Base tooltip component from shadcn/ui
- **Label**: Often used together for form field labeling
- **Form Components**: Commonly used with Input, Select, Textarea
- **Button**: Shares similar interaction patterns

## Migration Guide

### From Custom Tooltip Implementation

```typescript
// Before: Custom tooltip
<div className="relative group">
  <Info className="w-4 h-4" />
  <div className="absolute hidden group-hover:block ...">
    {helpText}
  </div>
</div>

// After: InfoTooltip component
<InfoTooltip content={helpText} />
```

### From Help Text Below Fields

```typescript
// Before: Static help text
<div>
  <Label>Field Name</Label>
  <Input />
  <p className="text-sm text-muted-foreground">{helpText}</p>
</div>

// After: Tooltip-based help
<div>
  <div className="flex items-center gap-2">
    <Label>Field Name</Label>
    <InfoTooltip content={helpText} />
  </div>
  <Input />
</div>
```