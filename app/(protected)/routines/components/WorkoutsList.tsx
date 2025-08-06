'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Dumbbell, Heart, MoreVertical } from 'lucide-react';
import type { WorkoutFilter } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkoutsListProps {
  filter: WorkoutFilter;
}

// Mock data - in real app, this would come from an API
const mockWorkouts = [
  {
    id: '1',
    name: 'Full Body Strength',
    description: 'A complete full body workout targeting all major muscle groups',
    duration: 60,
    difficulty: 'intermediate',
    targetMuscles: ['Chest', 'Back', 'Legs'],
    favorite: true,
    lastPerformed: '2024-03-10',
  },
  {
    id: '2',
    name: 'Upper Body Focus',
    description: 'Intensive upper body workout with emphasis on chest and arms',
    duration: 45,
    difficulty: 'advanced',
    targetMuscles: ['Chest', 'Shoulders', 'Arms'],
    favorite: false,
    lastPerformed: '2024-03-08',
  },
  // Add more mock workouts...
];

export default function WorkoutsList({}: WorkoutsListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="grid gap-4">
        {mockWorkouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">
                  {workout.name}
                </CardTitle>
                <CardDescription>{workout.description}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="flex gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.duration} min
                </Badge>
                <Badge variant="outline" className="flex gap-1">
                  <Dumbbell className="h-3 w-3" />
                  {workout.difficulty}
                </Badge>
                {workout.favorite && (
                  <Badge variant="outline" className="flex gap-1 text-primary">
                    <Heart className="h-3 w-3 fill-primary" />
                    Favorite
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {workout.targetMuscles.map((muscle) => (
                  <Badge key={muscle} variant="secondary" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
