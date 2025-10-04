'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Target } from 'lucide-react';
import { formatTime, formatDuration } from '@/lib/utils/time-format.utils';
import type { SessionProgressData } from '@/lib/utils/workout-session.types';

interface SessionHeaderProps {
  routineName: string;
  dayName: string;
  startedAt: string;
  progressData: SessionProgressData;
  onNavigateBack: () => void;
}

/**
 * Header component for workout session pages with navigation and status
 */
export const SessionHeader = ({
  routineName,
  dayName,
  startedAt,
  progressData,
  onNavigateBack,
}: SessionHeaderProps) => {
  const { completedSets, totalSets, percentage } = progressData;
  const isComplete = percentage === 100;
  const duration = formatDuration(
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation and title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg line-clamp-1">
                {routineName}
              </h1>
              <p className="text-sm text-muted-foreground">{dayName}</p>
            </div>
          </div>

          {/* Right side - Status and stats */}
          <div className="flex items-center gap-3">
            {/* Duration */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{completedSets}/{totalSets}</span>
            </div>

            {/* Status badge */}
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={`${
                isComplete 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                  : ""
              }`}
            >
              {isComplete ? "Complete" : `${Math.round(percentage)}%`}
            </Badge>
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="sm:hidden flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{completedSets}/{totalSets} sets</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Started: {formatTime(startedAt)}
          </div>
        </div>
      </div>
    </div>
  );
};