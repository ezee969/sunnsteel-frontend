'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { formatTime, formatDuration } from '@/lib/utils/time-format.utils';
import type { SessionProgressData } from '@/lib/utils/workout-session.types';

interface SessionActionCardProps {
  sessionId: string;
  routineName: string;
  dayName: string;
  startedAt: string;
  progressData: SessionProgressData;
  isFinishing: boolean;
  onFinishAttempt: () => void;
  onNavigateBack: () => void;
}

/**
 * Reusable component for displaying session information and primary actions
 */
export const SessionActionCard = ({
  sessionId,
  routineName,
  dayName,
  startedAt,
  progressData,
  isFinishing,
  onFinishAttempt,
  onNavigateBack,
}: SessionActionCardProps) => {
  const { completedSets, totalSets, percentage } = progressData;
  const isComplete = percentage === 100;
  const duration = formatDuration(
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );

  return (
    <Card className="sticky top-4 z-10 shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {routineName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{dayName}</p>
          </div>
          <Badge 
            variant={isComplete ? "default" : "secondary"}
            className={isComplete ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
          >
            {isComplete ? "Complete" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">{duration}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">
                {completedSets}/{totalSets}
              </p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
          />
        </div>

        {/* Session Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Started: {formatTime(startedAt)}</p>
          <p>Session ID: {sessionId.slice(-8)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={onFinishAttempt}
            disabled={isFinishing}
            size="sm"
            className={`flex-1 ${
              isComplete 
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' 
                : ''
            }`}
          >
            {isFinishing ? (
              <>
                <AlertCircle className="h-4 w-4 mr-1 animate-spin" />
                Finishing...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Finish Session
              </>
            ) : (
              'Finish Session'
            )}
          </Button>
        </div>

        {/* Completion Status */}
        {!isComplete && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Complete all sets to finish the session
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};