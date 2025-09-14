import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';

export default function WorkoutSessionLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroBackdrop
        src="/backgrounds/vertical-hero-greek-columns.webp"
        className="h-20 mb-6"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </HeroBackdrop>

      {/* Session Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-56 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Session Controls */}
      <div className="flex gap-3 justify-center">
        <Button disabled size="lg" className="flex-1 max-w-xs">
          <Play className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-20" />
        </Button>
        <Button disabled variant="destructive" size="lg" className="flex-1 max-w-xs">
          <Square className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-16" />
        </Button>
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-14 mb-1" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
