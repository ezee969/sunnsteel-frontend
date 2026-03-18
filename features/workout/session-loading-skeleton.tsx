'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionLoadingSkeletonProps {
  showHeader?: boolean;
  showActionCard?: boolean;
  exerciseCount?: number;
  setsPerExercise?: number;
}

/**
 * Loading skeleton component for workout session pages
 */
export const SessionLoadingSkeleton = ({
  showHeader = true,
  showActionCard = true,
  exerciseCount = 3,
  setsPerExercise = 3,
}: SessionLoadingSkeletonProps) => {
  return (
    <div 
      data-testid="session-loading-skeleton" 
      className="space-y-6"
      aria-label="Loading session data"
      role="status"
    >
      {/* Header Skeleton */}
      {showHeader && (
        <div data-testid="header-skeleton" className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 space-y-6">
        {/* Action Card Skeleton */}
        {showActionCard && (
          <Card data-testid="action-card-skeleton" className="sticky top-4 z-10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              
              {/* Session Info */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise Groups Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: exerciseCount }).map((_, exerciseIndex) => (
            <Card key={exerciseIndex} data-testid={`exercise-skeleton-${exerciseIndex}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {Array.from({ length: setsPerExercise }).map((_, setIndex) => (
                    <div
                      key={setIndex}
                      data-testid={`set-skeleton-${exerciseIndex}-${setIndex}`}
                      className="rounded-lg border-2 p-4 space-y-3"
                    >
                      {/* Set header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-12 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-8" />
                          <Skeleton className="h-5 w-5" />
                        </div>
                      </div>
                      
                      {/* Form inputs */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};