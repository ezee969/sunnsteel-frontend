'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipForward, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveWorkoutProps {
  className?: string;
}

export default function ActiveWorkout({ className }: ActiveWorkoutProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Active Workout</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Exercise</span>
            <span className="text-sm text-muted-foreground">3/8</span>
          </div>
          <Progress value={37.5} />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">Bench Press</h3>
            <p className="text-sm text-muted-foreground">3 sets × 12 reps</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-semibold">01:30</span>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline">
                <Pause className="h-4 w-4" />
              </Button>
              <Button size="icon">
                <Play className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] border rounded-md p-4">
          <div className="space-y-4">
            <h4 className="font-medium mb-2">Up Next</h4>
            {[
              'Incline Dumbbell Press',
              'Chest Flyes',
              'Tricep Pushdowns',
              'Lateral Raises',
            ].map((exercise, index) => (
              <div
                key={exercise}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index + 4}
                </div>
                <div>
                  <p className="font-medium">{exercise}</p>
                  <p className="text-sm text-muted-foreground">3 × 12</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
