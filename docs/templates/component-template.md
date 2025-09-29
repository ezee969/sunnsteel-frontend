# ComponentName

## Overview
Brief description of the component's purpose and primary use cases.

## Import
```typescript
import { ComponentName } from '@/components/path/ComponentName';
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `PropType` | `defaultValue` | Description of the prop |
| `optionalProp?` | `OptionalType` | `undefined` | Description of optional prop |

## Usage

### Basic Usage
```tsx
<ComponentName 
  propName="value"
  optionalProp="optional"
/>
```

### Advanced Usage
```tsx
<ComponentName 
  propName="value"
  optionalProp="optional"
  className="custom-styles"
  onAction={handleAction}
>
  <ChildComponent />
</ComponentName>
```

## Variants
If the component has variants, document them here:

- `default`: Standard appearance
- `variant1`: Description of variant
- `variant2`: Description of variant

## Accessibility
- ARIA attributes used
- Keyboard navigation support
- Screen reader considerations
- Focus management

## Examples

### Example 1: Basic Implementation
```tsx
function BasicExample() {
  return (
    <ComponentName 
      propName="example"
    />
  );
}
```

### Example 2: With State Management
```tsx
function StatefulExample() {
  const [state, setState] = useState(initialValue);
  
  return (
    <ComponentName 
      propName={state}
      onAction={setState}
    />
  );
}
```

## Styling
- CSS classes applied
- Customization options
- Theme integration
- Responsive behavior

## Related Components
- [RelatedComponent1](../path/RelatedComponent1.md)
- [RelatedComponent2](../path/RelatedComponent2.md)

## Notes
Any additional notes, gotchas, or important considerations.