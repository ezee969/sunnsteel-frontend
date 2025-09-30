# Backend API Integration Examples

This document provides comprehensive examples of integrating with the Sunnsteel Backend API from the frontend application, focusing on workout session management, authentication patterns, and real-world usage scenarios.

## Table of Contents

- [Authentication Integration](#authentication-integration)
- [Workout Session API Integration](#workout-session-api-integration)
- [Error Handling Patterns](#error-handling-patterns)
- [Real-World Usage Examples](#real-world-usage-examples)
- [Performance Optimization](#performance-optimization)
- [Testing Integration](#testing-integration)

## Authentication Integration

### Supabase Authentication Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### HTTP Client with Authentication

```typescript
// lib/http-client.ts
import { supabase } from './supabase'

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

class HttpClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options
    
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers as Record<string, string>
    }

    if (requireAuth) {
      const authHeaders = await this.getAuthHeaders()
      Object.assign(headers, authHeaders)
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.message || response.statusText,
        errorData
      )
    }

    return response.json()
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Export configured client
export const httpClient = new HttpClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
)
```

### Authentication Hook Integration

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { httpClient } from '@/lib/http-client'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session
      })

      // Verify session with backend if exists
      if (session) {
        try {
          await httpClient.post('/auth/supabase/verify', {
            token: session.access_token
          })
        } catch (error) {
          console.error('Session verification failed:', error)
          // Optionally sign out on verification failure
          await supabase.auth.signOut()
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session
        })

        // Handle session changes
        if (event === 'SIGNED_IN' && session) {
          // Verify new session with backend
          try {
            await httpClient.post('/auth/supabase/verify', {
              token: session.access_token
            })
          } catch (error) {
            console.error('Session verification failed:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    ...authState,
    signOut
  }
}
```

## Workout Session API Integration

### Workout Service Implementation

```typescript
// services/workout-service.ts
import { httpClient } from '@/lib/http-client'
import type {
  WorkoutSession,
  StartSessionRequest,
  FinishSessionRequest,
  SetLogRequest,
  ListSessionsRequest,
  ListSessionsResponse
} from '@/types/workout'

export class WorkoutService {
  // Start a new workout session
  async startSession(data: StartSessionRequest): Promise<WorkoutSession> {
    try {
      return await httpClient.post<WorkoutSession>('/workouts/sessions/start', data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Handle active session conflict
        const activeSession = await this.getActiveSession()
        throw new ActiveSessionConflictError(activeSession)
      }
      throw error
    }
  }

  // Get active workout session
  async getActiveSession(): Promise<WorkoutSession | null> {
    try {
      return await httpClient.get<WorkoutSession>('/workouts/sessions/active')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  }

  // Finish workout session
  async finishSession(
    sessionId: string, 
    data: FinishSessionRequest
  ): Promise<WorkoutSession> {
    return httpClient.patch<WorkoutSession>(
      `/workouts/sessions/${sessionId}/finish`,
      data
    )
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<WorkoutSession> {
    return httpClient.get<WorkoutSession>(`/workouts/sessions/${sessionId}`)
  }

  // Upsert set logs
  async upsertSetLog(
    sessionId: string,
    data: SetLogRequest
  ): Promise<void> {
    return httpClient.put<void>(
      `/workouts/sessions/${sessionId}/set-logs`,
      data
    )
  }

  // Delete set log
  async deleteSetLog(
    sessionId: string,
    routineExerciseId: string,
    setNumber: number
  ): Promise<void> {
    return httpClient.delete<void>(
      `/workouts/sessions/${sessionId}/set-logs/${routineExerciseId}/${setNumber}`
    )
  }

  // List sessions with filtering
  async listSessions(params: ListSessionsRequest = {}): Promise<ListSessionsResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/workouts/sessions${queryString ? `?${queryString}` : ''}`
    
    return httpClient.get<ListSessionsResponse>(endpoint)
  }
}

// Custom error for active session conflicts
export class ActiveSessionConflictError extends Error {
  constructor(public activeSession: WorkoutSession) {
    super('An active workout session already exists')
    this.name = 'ActiveSessionConflictError'
  }
}

// Export singleton instance
export const workoutService = new WorkoutService()
```

### React Query Integration

```typescript
// hooks/useWorkoutSession.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workoutService, ActiveSessionConflictError } from '@/services/workout-service'
import type { StartSessionRequest, FinishSessionRequest } from '@/types/workout'

// Query keys for consistent caching
export const workoutKeys = {
  all: ['workouts'] as const,
  sessions: () => [...workoutKeys.all, 'sessions'] as const,
  session: (id: string) => [...workoutKeys.sessions(), id] as const,
  activeSession: () => [...workoutKeys.sessions(), 'active'] as const,
  sessionsList: (filters: any) => [...workoutKeys.sessions(), 'list', filters] as const,
}

// Get active session
export const useActiveSession = () => {
  return useQuery({
    queryKey: workoutKeys.activeSession(),
    queryFn: workoutService.getActiveSession,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: (failureCount, error) => {
      // Don't retry on 404 (no active session)
      if (error instanceof ApiError && error.status === 404) {
        return false
      }
      return failureCount < 3
    }
  })
}

// Get session by ID
export const useWorkoutSession = (sessionId: string) => {
  return useQuery({
    queryKey: workoutKeys.session(sessionId),
    queryFn: () => workoutService.getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Start session mutation
export const useStartSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StartSessionRequest) => workoutService.startSession(data),
    onSuccess: (newSession) => {
      // Update active session cache
      queryClient.setQueryData(workoutKeys.activeSession(), newSession)
      
      // Update sessions list cache
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() })
      
      // Set individual session cache
      queryClient.setQueryData(workoutKeys.session(newSession.id), newSession)
    },
    onError: (error) => {
      if (error instanceof ActiveSessionConflictError) {
        // Update active session cache with conflict data
        queryClient.setQueryData(
          workoutKeys.activeSession(), 
          error.activeSession
        )
      }
    }
  })
}

// Finish session mutation
export const useFinishSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: { 
      sessionId: string
      data: FinishSessionRequest 
    }) => workoutService.finishSession(sessionId, data),
    onSuccess: (finishedSession) => {
      // Clear active session if this was the active one
      const activeSession = queryClient.getQueryData(workoutKeys.activeSession())
      if (activeSession?.id === finishedSession.id) {
        queryClient.setQueryData(workoutKeys.activeSession(), null)
      }
      
      // Update individual session cache
      queryClient.setQueryData(
        workoutKeys.session(finishedSession.id), 
        finishedSession
      )
      
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() })
    }
  })
}

// List sessions
export const useWorkoutSessions = (filters: ListSessionsRequest = {}) => {
  return useQuery({
    queryKey: workoutKeys.sessionsList(filters),
    queryFn: () => workoutService.listSessions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
```

## Error Handling Patterns

### Centralized Error Handler

```typescript
// lib/error-handler.ts
import { toast } from '@/components/ui/use-toast'
import { ApiError } from '@/lib/http-client'
import { ActiveSessionConflictError } from '@/services/workout-service'

export interface ErrorHandlerOptions {
  showToast?: boolean
  customMessage?: string
  onError?: (error: Error) => void
}

export const handleApiError = (
  error: unknown, 
  options: ErrorHandlerOptions = {}
) => {
  const { showToast = true, customMessage, onError } = options

  let message = 'An unexpected error occurred'
  let title = 'Error'

  if (error instanceof ActiveSessionConflictError) {
    title = 'Active Session Conflict'
    message = 'You already have an active workout session. Please finish it before starting a new one.'
  } else if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        title = 'Authentication Error'
        message = 'Please sign in to continue'
        break
      case 403:
        title = 'Permission Denied'
        message = 'You do not have permission to perform this action'
        break
      case 404:
        title = 'Not Found'
        message = 'The requested resource was not found'
        break
      case 409:
        title = 'Conflict'
        message = error.message || 'A conflict occurred with your request'
        break
      case 422:
        title = 'Validation Error'
        message = error.message || 'Please check your input and try again'
        break
      case 429:
        title = 'Rate Limited'
        message = 'Too many requests. Please wait a moment and try again'
        break
      case 500:
        title = 'Server Error'
        message = 'A server error occurred. Please try again later'
        break
      default:
        message = error.message || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  if (customMessage) {
    message = customMessage
  }

  if (showToast) {
    toast({
      title,
      description: message,
      variant: 'destructive'
    })
  }

  if (onError) {
    onError(error as Error)
  }

  // Log error for debugging
  console.error('API Error:', error)
}
```

### Error Boundary for API Errors

```typescript
// components/error-boundary.tsx
import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Real-World Usage Examples

### Complete Workout Session Flow

```typescript
// components/workout-session-manager.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  useActiveSession, 
  useStartSession, 
  useFinishSession 
} from '@/hooks/useWorkoutSession'
import { handleApiError } from '@/lib/error-handler'
import { ActiveSessionConflictError } from '@/services/workout-service'

interface WorkoutSessionManagerProps {
  routineId: string
  routineDayId: string
}

export const WorkoutSessionManager: React.FC<WorkoutSessionManagerProps> = ({
  routineId,
  routineDayId
}) => {
  const router = useRouter()
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictSession, setConflictSession] = useState<WorkoutSession | null>(null)

  const { data: activeSession, isLoading: isLoadingActive } = useActiveSession()
  const startSessionMutation = useStartSession()
  const finishSessionMutation = useFinishSession()

  const handleStartSession = async () => {
    try {
      const newSession = await startSessionMutation.mutateAsync({
        routineId,
        routineDayId
      })
      
      // Navigate to the new session
      router.push(`/workouts/${newSession.id}`)
    } catch (error) {
      if (error instanceof ActiveSessionConflictError) {
        setConflictSession(error.activeSession)
        setShowConflictDialog(true)
      } else {
        handleApiError(error, {
          customMessage: 'Failed to start workout session'
        })
      }
    }
  }

  const handleGoToActiveSession = () => {
    if (conflictSession) {
      router.push(`/workouts/${conflictSession.id}`)
    } else if (activeSession) {
      router.push(`/workouts/${activeSession.id}`)
    }
    setShowConflictDialog(false)
  }

  const handleFinishAndStartNew = async () => {
    if (!conflictSession) return

    try {
      // Finish the current session
      await finishSessionMutation.mutateAsync({
        sessionId: conflictSession.id,
        data: { status: 'CANCELLED' }
      })

      // Start the new session
      const newSession = await startSessionMutation.mutateAsync({
        routineId,
        routineDayId
      })

      // Navigate to the new session
      router.push(`/workouts/${newSession.id}`)
      setShowConflictDialog(false)
    } catch (error) {
      handleApiError(error, {
        customMessage: 'Failed to finish current session and start new one'
      })
    }
  }

  if (isLoadingActive) {
    return <Button disabled>Loading...</Button>
  }

  return (
    <>
      <Button 
        onClick={handleStartSession}
        disabled={startSessionMutation.isPending}
      >
        {startSessionMutation.isPending ? 'Starting...' : 'Start Workout'}
      </Button>

      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active Session Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              You already have an active workout session. What would you like to do?
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGoToActiveSession}
              >
                Go to Active Session
              </Button>
              <Button 
                variant="destructive"
                onClick={handleFinishAndStartNew}
                disabled={finishSessionMutation.isPending}
              >
                {finishSessionMutation.isPending 
                  ? 'Finishing...' 
                  : 'Finish Current & Start New'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Set Log Management

```typescript
// components/set-log-form.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { workoutService } from '@/services/workout-service'
import { workoutKeys } from '@/hooks/useWorkoutSession'
import { handleApiError } from '@/lib/error-handler'

const setLogSchema = z.object({
  weight: z.number().min(0).max(1000),
  reps: z.number().min(0).max(100),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional()
})

type SetLogFormData = z.infer<typeof setLogSchema>

interface SetLogFormProps {
  sessionId: string
  routineExerciseId: string
  setNumber: number
  initialData?: Partial<SetLogFormData>
  onSuccess?: () => void
}

export const SetLogForm: React.FC<SetLogFormProps> = ({
  sessionId,
  routineExerciseId,
  setNumber,
  initialData,
  onSuccess
}) => {
  const queryClient = useQueryClient()
  
  const form = useForm<SetLogFormData>({
    resolver: zodResolver(setLogSchema),
    defaultValues: {
      weight: initialData?.weight || 0,
      reps: initialData?.reps || 0,
      rpe: initialData?.rpe,
      notes: initialData?.notes || ''
    }
  })

  const upsertSetLogMutation = useMutation({
    mutationFn: (data: SetLogFormData) => 
      workoutService.upsertSetLog(sessionId, {
        routineExerciseId,
        setNumber,
        ...data
      }),
    onSuccess: () => {
      // Invalidate session data to refetch with updated set logs
      queryClient.invalidateQueries({
        queryKey: workoutKeys.session(sessionId)
      })
      
      // Update active session if this is the active one
      queryClient.invalidateQueries({
        queryKey: workoutKeys.activeSession()
      })
      
      onSuccess?.()
    },
    onError: (error) => {
      handleApiError(error, {
        customMessage: 'Failed to save set log'
      })
    }
  })

  const onSubmit = (data: SetLogFormData) => {
    upsertSetLogMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reps</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rpe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RPE (1-10)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional notes..." />
              </FormControl>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={upsertSetLogMutation.isPending}
          className="w-full"
        >
          {upsertSetLogMutation.isPending ? 'Saving...' : 'Save Set'}
        </Button>
      </form>
    </Form>
  )
}
```

## Performance Optimization

### Request Deduplication

```typescript
// lib/request-deduplication.ts
import { QueryClient } from '@tanstack/react-query'

// Configure React Query for optimal performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time - how long data stays in cache after component unmounts
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 3
      },
      
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for critical data
      refetchOnWindowFocus: (query) => {
        // Only refetch active session and current session data
        return query.queryKey.includes('active') || query.queryKey.includes('session')
      },
      
      // Background refetch interval for active session
      refetchInterval: (data, query) => {
        if (query.queryKey.includes('active') && data) {
          return 60 * 1000 // Refetch active session every minute
        }
        return false
      }
    },
    mutations: {
      // Retry mutations on network errors
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 500) {
          return failureCount < 2
        }
        return false
      }
    }
  }
})
```

### Optimistic Updates

```typescript
// hooks/useOptimisticSetLog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workoutService } from '@/services/workout-service'
import { workoutKeys } from '@/hooks/useWorkoutSession'
import type { SetLogRequest, WorkoutSession } from '@/types/workout'

export const useOptimisticSetLog = (sessionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SetLogRequest) => 
      workoutService.upsertSetLog(sessionId, data),
    
    onMutate: async (newSetLog) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: workoutKeys.session(sessionId) 
      })

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData<WorkoutSession>(
        workoutKeys.session(sessionId)
      )

      // Optimistically update the cache
      if (previousSession) {
        const updatedSession = {
          ...previousSession,
          setLogs: [
            ...previousSession.setLogs.filter(
              log => !(
                log.routineExerciseId === newSetLog.routineExerciseId &&
                log.setNumber === newSetLog.setNumber
              )
            ),
            {
              id: `temp-${Date.now()}`, // Temporary ID
              sessionId,
              ...newSetLog,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }

        queryClient.setQueryData(
          workoutKeys.session(sessionId),
          updatedSession
        )
      }

      // Return context for rollback
      return { previousSession }
    },

    onError: (error, newSetLog, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(
          workoutKeys.session(sessionId),
          context.previousSession
        )
      }
    },

    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ 
        queryKey: workoutKeys.session(sessionId) 
      })
    }
  })
}
```

## Testing Integration

### Mock Service Setup

```typescript
// test/mocks/workout-service.ts
import { vi } from 'vitest'
import type { WorkoutService } from '@/services/workout-service'

export const createMockWorkoutService = (): jest.Mocked<WorkoutService> => ({
  startSession: vi.fn(),
  getActiveSession: vi.fn(),
  finishSession: vi.fn(),
  getSession: vi.fn(),
  upsertSetLog: vi.fn(),
  deleteSetLog: vi.fn(),
  listSessions: vi.fn()
})

export const mockWorkoutService = createMockWorkoutService()

// Mock the service module
vi.mock('@/services/workout-service', () => ({
  workoutService: mockWorkoutService,
  WorkoutService: vi.fn(() => mockWorkoutService),
  ActiveSessionConflictError: class extends Error {
    constructor(public activeSession: any) {
      super('Active session conflict')
    }
  }
}))
```

### Integration Test Example

```typescript
// test/integration/workout-session.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkoutSessionManager } from '@/components/workout-session-manager'
import { mockWorkoutService } from '@/test/mocks/workout-service'
import { createMockSession } from '@/test/factories/workout'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('WorkoutSessionManager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start a new session successfully', async () => {
    const mockSession = createMockSession()
    mockWorkoutService.getActiveSession.mockResolvedValue(null)
    mockWorkoutService.startSession.mockResolvedValue(mockSession)

    renderWithProviders(
      <WorkoutSessionManager 
        routineId="routine-1" 
        routineDayId="day-1" 
      />
    )

    fireEvent.click(screen.getByText('Start Workout'))

    await waitFor(() => {
      expect(mockWorkoutService.startSession).toHaveBeenCalledWith({
        routineId: 'routine-1',
        routineDayId: 'day-1'
      })
    })
  })

  it('should handle active session conflict', async () => {
    const activeSession = createMockSession({ id: 'active-session' })
    const conflictError = new ActiveSessionConflictError(activeSession)
    
    mockWorkoutService.getActiveSession.mockResolvedValue(activeSession)
    mockWorkoutService.startSession.mockRejectedValue(conflictError)

    renderWithProviders(
      <WorkoutSessionManager 
        routineId="routine-1" 
        routineDayId="day-1" 
      />
    )

    fireEvent.click(screen.getByText('Start Workout'))

    await waitFor(() => {
      expect(screen.getByText('Active Session Detected')).toBeInTheDocument()
    })

    expect(screen.getByText('Go to Active Session')).toBeInTheDocument()
    expect(screen.getByText('Finish Current & Start New')).toBeInTheDocument()
  })
})
```

### API Error Testing

```typescript
// test/integration/api-error-handling.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from '@/components/ui/use-toast'
import { ApiError } from '@/lib/http-client'
import { handleApiError } from '@/lib/error-handler'

vi.mock('@/components/ui/use-toast')

describe('API Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle 401 authentication errors', () => {
    const error = new ApiError(401, 'Unauthorized')
    
    handleApiError(error)

    expect(toast).toHaveBeenCalledWith({
      title: 'Authentication Error',
      description: 'Please sign in to continue',
      variant: 'destructive'
    })
  })

  it('should handle 409 conflict errors', () => {
    const error = new ApiError(409, 'Active session exists')
    
    handleApiError(error)

    expect(toast).toHaveBeenCalledWith({
      title: 'Conflict',
      description: 'Active session exists',
      variant: 'destructive'
    })
  })

  it('should handle network errors', () => {
    const error = new Error('Network error')
    
    handleApiError(error)

    expect(toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Network error',
      variant: 'destructive'
    })
  })
})
```

## Best Practices Summary

### 1. Authentication
- Always verify tokens with the backend
- Handle token refresh automatically
- Implement proper session cleanup

### 2. Error Handling
- Use centralized error handling
- Provide meaningful error messages
- Implement proper retry logic

### 3. Performance
- Use React Query for caching and deduplication
- Implement optimistic updates for better UX
- Prefetch likely navigation targets

### 4. Testing
- Mock services at the boundary
- Test error scenarios thoroughly
- Use integration tests for critical flows

### 5. Type Safety
- Define comprehensive TypeScript types
- Use Zod for runtime validation
- Maintain type consistency between frontend and backend

This comprehensive integration guide provides the foundation for robust, performant, and maintainable API integration patterns in the Sunnsteel Frontend application.