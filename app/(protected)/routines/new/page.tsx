'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';

// Step components
import { RoutineBasicInfo } from '@/components/routines/create/RoutineBasicInfo';
import { TrainingDays } from '@/components/routines/create/TrainingDays';
import { BuildDays } from '@/components/routines/create/BuildDays';
import { ReviewAndCreate } from '@/components/routines/create/ReviewAndCreate';
import { RoutineWizardData } from '@/components/routines/create/types';

// Use shared RoutineWizardData type

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and description' },
  { id: 2, title: 'Training Days', description: 'Select workout days' },
  { id: 3, title: 'Build Days', description: 'Add exercises and sets' },
  { id: 4, title: 'Review & Create', description: 'Review and save routine' },
];

export default function CreateRoutinePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState(new Set([1])); // Track visited steps
  const [routineData, setRoutineData] = useState<RoutineWizardData>({
    name: '',
    description: '',
    trainingDays: [],
    days: [],
  });

  const updateRoutineData = (updates: Partial<RoutineWizardData>) => {
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
        return routineData.days.every(day => day.exercises.length > 0);
      default:
        return true;
    }
  };

  const handleCancel = () => {
    router.push('/routines');
  };

  const renderCurrentStep = () => {
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
            onComplete={() => {
              // This will handle the API call and redirect
              router.push('/routines');
            }}
          />
        );
      default:
        return null;
    }
  };

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
        <h1 className="text-3xl font-bold">Create New Routine</h1>
        <p className="text-muted-foreground mt-2">
          Build your custom workout routine step by step
        </p>
      </div>

      {/* Compact Stepper */}
      {/* New Stepper */}
      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} visitedSteps={visitedSteps} />
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
        <CardContent className="p-6">{renderCurrentStep()}</CardContent>
      </Card>

      {/* Navigation */}
      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNextStep()}
            className="gap-2"
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
