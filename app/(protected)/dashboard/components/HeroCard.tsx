import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HeroCardProps {
  title: string;
  description: string;
  primaryAction: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  progressPercentage?: number;
}

export default function HeroCard({
  title,
  description,
  primaryAction,
  secondaryAction,
  progressPercentage,
}: HeroCardProps) {
  return (
    <Card className="overflow-hidden border-none bg-gradient-to-r from-primary/80 to-primary shadow-lg">
      <CardContent className="p-4 sm:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {title}
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base">
              {description}
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Button variant="default" onClick={primaryAction.onClick}>
                {primaryAction.text}
              </Button>
              {secondaryAction && (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.text}
                </Button>
              )}
            </div>
          </div>
          {progressPercentage !== undefined && (
            <div className="hidden sm:flex items-center justify-center">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - progressPercentage / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-3xl font-bold">{progressPercentage}%</span>
                  <span className="text-xs">Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
