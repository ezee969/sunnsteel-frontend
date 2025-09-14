import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';

export default function WorkoutHistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroBackdrop
        src="/backgrounds/vertical-hero-greek-columns.webp"
        className="h-24 mb-8"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </HeroBackdrop>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Session History List */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-12 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-10 mb-1" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-4">
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  );
}
