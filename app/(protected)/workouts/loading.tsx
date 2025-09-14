import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, TrendingUp } from 'lucide-react';

export default function WorkoutsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <Skeleton className="h-5 w-32 mx-auto mb-1" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              <Skeleton className="h-4 w-20" />
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <Skeleton className="h-5 w-28 mx-auto mb-1" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              <Skeleton className="h-4 w-24" />
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <Skeleton className="h-5 w-24 mx-auto mb-1" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              <Skeleton className="h-4 w-20" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
