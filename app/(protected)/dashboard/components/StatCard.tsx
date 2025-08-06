import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  progress?: number;
  progressMax?: number;
  progressText?: string;
  additionalText?: string;
}

export default function StatCard({
  icon,
  title,
  value,
  unit,
  subtitle,
  progress,
  progressMax = 100,
  progressText,
  additionalText,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-card hover:shadow-lg transition-all">
      <div className="absolute top-0 right-0 p-2 sm:p-4">
        <div className="rounded-full bg-primary/10 p-1.5 sm:p-2">{icon}</div>
      </div>
      <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <div className="flex items-baseline gap-1">
          <div className="text-xl sm:text-3xl font-bold">{value}</div>
          {unit && (
            <div className="text-xs sm:text-sm text-muted-foreground">{unit}</div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            {subtitle}
          </p>
        )}
        {progress !== undefined && (
          <div className="mt-2 sm:mt-3">
            <Progress
              value={progress}
              max={progressMax}
              className="h-1.5 sm:h-2 bg-primary/10"
            />
            <div className="mt-1 flex justify-between text-[10px] sm:text-xs">
              <span className="text-muted-foreground">{progressText}</span>
              {additionalText && (
                <span className="text-primary font-medium">{additionalText}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
