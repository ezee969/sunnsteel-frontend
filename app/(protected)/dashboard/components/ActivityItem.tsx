import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  time: string;
  badges?: Array<string>;
  showSeparator?: boolean;
}

export default function ActivityItem({
  icon,
  title,
  time,
  badges = [],
  showSeparator = true,
}: ActivityItemProps) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{time}</p>
          {badges.length > 0 && (
            <div className="mt-2 flex gap-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-primary/5 hover:bg-primary/10 text-foreground"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      {showSeparator && <Separator />}
    </>
  );
}
