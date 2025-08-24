'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';

// Step components
import { RoutineBasicInfo } from '@/components/routines/create/RoutineBasicInfo';
import { TrainingDays } from '@/components/routines/create/TrainingDays';
import { BuildDays } from '@/components/routines/create/BuildDays';
import { ReviewAndCreate } from '@/components/routines/create/ReviewAndCreate';
import { useRoutine, useUpdateRoutine, useCreateRoutine } from '@/lib/api/hooks/useRoutines';
import { RoutineDay, RoutineExercise } from '@/lib/api/types/routine.type';

interface RoutineData {
  name: string;
  description?: string;
  trainingDays: number[];
  days: Array<{
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      sets: Array<{
        setNumber: number;
        reps: number;
        weight?: number;
      }>;
      restSeconds: number;
    }>;
  }>;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and description' },
  { id: 2, title: 'Training Days', description: 'Select workout days' },
  { id: 3, title: 'Build Days', description: 'Add exercises and sets' },
  { id: 4, title: 'Review & Update', description: 'Review and save changes' },
];

export default function EditRoutinePage() {
  const params = useParams<{ id: string }>();
  const routineId = (params?.id ?? '') as string;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState(new Set([1]));
  const [routineData, setRoutineData] = useState<RoutineData>({
    name: '',
    description: '',
    trainingDays: [],
    days: [],
  });

  const { data: routine, isLoading, error } = useRoutine(routineId);
  const updateRoutineMutation = useUpdateRoutine();
  const createRoutineMutation = useCreateRoutine();

  // Initialize form with routine data when loaded
  useEffect(() => {
    if (routine) {
      // Transform the routine data to match our form state
      const transformedData: RoutineData = {
        name: routine.name,
        description: routine.description || '',
        trainingDays: routine.days.map((day: RoutineDay) => day.dayOfWeek),
        days: routine.days.map((day: RoutineDay) => ({
          dayOfWeek: day.dayOfWeek,
          exercises: day.exercises.map((exercise: RoutineExercise) => ({
            exerciseId: exercise.exercise.id,
            sets: exercise.sets.map((set, index) => ({
              setNumber: index + 1,
              reps: set.reps,
              weight: set.weight,
            })),
            restSeconds: exercise.restSeconds,
          })),
        })),
      };
      
      setRoutineData(transformedData);
    }
  }, [routine]);

  const updateRoutineData = (updates: Partial<RoutineData>) => {
    setRoutineData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to any previously visited step
    if (visitedSteps.has(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return routineData.name.trim() !== '';
      case 2: // Training Days
        return routineData.trainingDays.length > 0;
      case 3: // Build Days
        return routineData.days.every((day: { exercises: Array<unknown> }) => day.exercises.length > 0);
      default:
        return true;
    }
  };

  const handleCancel = () => {
    router.push('/routines');
  };

  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading routine data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Error loading routine</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error.message || 'We couldn\'t load the routine data. Please check your connection and try again.'}
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => router.push('/routines')}>
              Back to Routines
            </Button>
            <Button onClick={() => router.refresh()}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <RoutineBasicInfo data={routineData} onUpdate={updateRoutineData} />;
      case 2:
        return <TrainingDays data={routineData} onUpdate={updateRoutineData} />;
      case 3:
        return <BuildDays data={routineData} onUpdate={updateRoutineData} />;
      case 4:
        return (
          <ReviewAndCreate
            data={routineData}
            routineId={routineId}
            isEditing={true}
            onComplete={() => {
              router.push('/routines');
            }}
          />
        );
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 1;
  const isSubmitting = createRoutineMutation.isPending || updateRoutineMutation.isPending;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Routines
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Edit Routine</h1>
        <p className="text-muted-foreground mt-2">
          Update your workout routine step by step
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <Stepper 
          steps={STEPS} 
          currentStep={currentStep} 
          onStepClick={handleStepClick} 
          visitedSteps={visitedSteps} 
        />
      </div>

      {/* Main Content */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg sm:text-xl">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="hidden sm:block">
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNextStep() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span className="sr-only sm:not-sr-only">
                  {currentStep === STEPS.length - 1 ? 'Review' : 'Next'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
