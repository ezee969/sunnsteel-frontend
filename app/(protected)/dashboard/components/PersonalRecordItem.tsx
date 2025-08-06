import { Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PersonalRecordItemProps {
  exercise: string;
  timeAgo: string;
  weight: string;
  showSeparator?: boolean;
}

export default function PersonalRecordItem({
  exercise,
  timeAgo,
  weight,
  showSeparator = true,
}: PersonalRecordItemProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{exercise}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-bold bg-primary/5 hover:bg-primary/10"
        >
          {weight}
        </Badge>
      </div>
      {showSeparator && <Separator />}
    </>
  );
}
