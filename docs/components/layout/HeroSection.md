# HeroSection Component

A responsive hero section with background image, overlays, and decorative elements.

## Import
```typescript
import { HeroSection } from '@/components/layout/HeroSection';
```

## Props
- `imageSrc` (string): Background image URL
- `title` (ReactNode): Main heading content
- `subtitle?` (ReactNode): Optional subtitle text
- `overlayGradient?` (string): Custom gradient overlay
- `blurPx?` (number): Background blur intensity (default: 5)
- `sectionClassName?` (string): Additional section classes
- `innerClassName?` (string): Additional inner container classes

## Usage
```typescript
// Basic usage
<HeroSection
  imageSrc="/backgrounds/art-bg-1.webp"
  title="Dashboard"
  subtitle="Track your fitness journey"
/>

// Custom styling
<HeroSection
  imageSrc="/backgrounds/art-bg-2.webp"
  title="My Routines"
  blurPx={8}
  overlayGradient="linear-gradient(45deg, rgba(0,0,0,0.6), rgba(0,0,0,0.2))"
  sectionClassName="mb-6"
/>
```

## Features
- Responsive height (110px mobile, 150px desktop)
- Classical typography styling
- Integrated background components (HeroBackdrop, ParchmentOverlay, OrnateCorners)
- Customizable blur and overlay effects
- Rounded corners with border

## Related Components
- <mcfile name="HeroBackdrop.tsx" path="components/backgrounds/HeroBackdrop.tsx"></mcfile>
- <mcfile name="ParchmentOverlay.tsx" path="components/backgrounds/ParchmentOverlay.tsx"></mcfile>
- <mcfile name="OrnateCorners.tsx" path="components/backgrounds/OrnateCorners.tsx"></mcfile>