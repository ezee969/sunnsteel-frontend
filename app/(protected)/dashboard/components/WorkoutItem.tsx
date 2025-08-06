import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight } from 'lucide-react';

interface WorkoutItemProps {
  icon: React.ReactNode;
  title: string;
  duration: string;
  dateTime: string;
  onClick: () => void;
  showSeparator?: boolean;
}

export default function WorkoutItem({
  icon,
  title,
  duration,
  dateTime,
  onClick,
  showSeparator = true,
}: WorkoutItemProps) {
  return (
    <>
      <div className="group relative flex items-center gap-4 rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <p className="font-medium">{title}</p>
            <Badge variant="outline" className="ml-2 bg-primary/5">
              {duration}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{dateTime}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {showSeparator && <Separator />}
    </>
  );
}
