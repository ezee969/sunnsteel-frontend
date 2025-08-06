'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkoutProgramCard from './WorkoutProgramCard';

export default function WorkoutPrograms() {
  const handleStartProgram = () => {
    // Handle starting a program
    console.log('Starting program...');
  };

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Workout Programs</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Choose a program that fits your goals
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="strength" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
            <TabsTrigger
              value="strength"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Strength
            </TabsTrigger>
            <TabsTrigger
              value="hypertrophy"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Hypertrophy
            </TabsTrigger>
            <TabsTrigger
              value="endurance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Endurance
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Custom
            </TabsTrigger>
          </TabsList>
          <TabsContent value="strength" className="mt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <WorkoutProgramCard
                title="5x5 StrongLifts"
                description="Focus on compound movements with progressive overload."
                duration="12 weeks"
                frequency="3x per week"
                level="Beginner/Intermediate"
                onStart={handleStartProgram}
              />
              <WorkoutProgramCard
                title="Starting Strength"
                description="Linear progression program focused on building strength."
                duration="16 weeks"
                frequency="3x per week"
                level="Beginner"
                onStart={handleStartProgram}
              />
              <WorkoutProgramCard
                title="Wendler 5/3/1"
                description="Submaximal training approach for consistent progress."
                duration="16+ weeks"
                frequency="4x per week"
                level="Intermediate/Advanced"
                onStart={handleStartProgram}
              />
            </div>
          </TabsContent>
          {/* Add other tabs content as needed */}
        </Tabs>
      </CardContent>
    </Card>
  );
}
