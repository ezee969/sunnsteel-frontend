import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface WorkoutProgramCardProps {
  title: string;
  description: string;
  duration: string;
  frequency: string;
  level: string;
  onStart: () => void;
}

export default function WorkoutProgramCard({
  title,
  description,
  duration,
  frequency,
  level,
  onStart,
}: WorkoutProgramCardProps) {
  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all">
      <div className="h-3 bg-gradient-to-r from-primary to-primary/70" />
      <CardHeader className="pb-2 p-3 sm:p-6">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Duration:</span>
            <span className="font-medium">{duration}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frequency:</span>
            <span className="font-medium">{frequency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Level:</span>
            <span className="font-medium">{level}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 h-9 text-sm px-3 sm:h-10 sm:px-4"
          onClick={onStart}
        >
          Start Program
        </Button>
      </CardFooter>
    </Card>
  );
}
