# Feature Components

Brief documentation for feature-specific components organized by domain.

## Routines Components

### Core Components
- **RoutineCard** - Individual routine display with actions
- **EmptyRoutinesState** - Empty state for routine lists
- **RoutinesSkeletonList** - Loading skeleton for routine lists
- **RoutineProgress** - Progress visualization for routines
- **RoutineMetaBadges** - Metadata badges (days, exercises, etc.)

### RTF (Reps to Failure) Components
- **RtfDashboard** - Main RTF program overview
- **RtfTimeline** - Visual timeline of RTF program weeks
- **RtfForecastCard** - Future program predictions
- **AmrapPerformancePanel** - AMRAP performance tracking
- **WeeklyTrendCharts** - Progress visualization charts
- **TmAdjustmentPanel** - Training max adjustment interface

### Program Management
- **ProgramHistoryModal** - Program change history viewer
- **ProgramStatusBadge** - Program status indicator
- **ProgramStyleBadge** - Program type indicator
- **AnomalyNotificationSurface** - Performance anomaly alerts

### Routine Wizard
- **RoutineBasicInfo** - Basic routine metadata form
- **TrainingDays** - Training day selection
- **BuildDays** - Exercise configuration per day
- **ExerciseCard** - Individual exercise configuration
- **ReviewAndCreate** - Final review and submission

## Shell Components

### Navigation
- **Header** - Main application header with user menu
- **Sidebar** - Main navigation sidebar

## Usage Patterns

```typescript
// Routine display
import { RoutineCard } from '@/features/routines/components/RoutineCard';

// RTF dashboard
import { RtfDashboard } from '@/features/routines/components/RtfDashboard';

// Shell layout
import { Header } from '@/features/shell/components/Header';
import { Sidebar } from '@/features/shell/components/Sidebar';
```

## Related Documentation
- [Custom Components](../custom/README.md)
- [Layout Components](../layout/README.md)
- [Background Components](../backgrounds/README.md)