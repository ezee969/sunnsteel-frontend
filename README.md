## Project structure

```
project-root/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout with providers
│   ├── (auth)/                    # Auth route group
│   │   ├── login/                 #   Login page
│   │   └── register/              #   Registration page
│   └── (protected)/               # Protected routes
│       ├── dashboard/             #   Dashboard page
│       ├── workouts/              #   Workouts page
│       └── layout.tsx             #   Protected routes layout
├── components/                    # Reusable UI components
│   ├── ui/                        #   Base UI components
│   ├── layout/                    #   Layout components (Header, Sidebar)
│   └── forms/                     #   Form components
├── lib/                           # Application logic
│   ├── redux/                     #   Redux state management
│   │   ├── store.ts               #     Redux store configuration
│   │   ├── hooks.ts               #     Typed hooks (useAppDispatch, useAppSelector)
│   │   └── slices/                #     Redux slices
│   │       ├── themeSlice.ts      #       UI preferences
│   │       ├── authSlice.ts       #       Authentication state
│   │       └── uiSlice.ts         #       UI state (modals, drawers, etc.)
│   └── api/                       #   API integration with TanStack Query
│       ├── hooks/                 #     TanStack Query hooks by domain
│       │   ├── useAuth.ts         #       Authentication API hooks
│       │   ├── useWorkouts.ts     #       Workout-related API hooks
│       │   └── useExercises.ts    #       Exercise-related API hooks
│       ├── services/              #     API service functions
│       │   ├── authService.ts     #       Auth API functions
│       │   └── workoutService.ts  #       Workout API functions
│       ├── types/                 #     API response and request types
│       └── utils/                 #     API utilities (request helpers, etc.)
├── providers/                     # Application providers
│   ├── app-provider.tsx           #   Combined providers wrapper
│   ├── query-provider.tsx         #   TanStack Query provider
│   └── redux-provider.tsx         #   Redux provider
├── hooks/                         # Custom React hooks
├── utils/                         # General utility functions
├── types/                         # TypeScript type definitions
├── middleware.ts                  # Middleware for handling requests before reaching the route handlers
└── public/                        # Static assets
```
