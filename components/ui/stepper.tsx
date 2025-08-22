'use client';

import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepId: number) => void;
  visitedSteps?: Set<number>;
}

export function Stepper({ steps, currentStep, className, onStepClick, visitedSteps }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Version - Vertical Layout */}
      <div className="block sm:hidden">
        <div className="space-y-4">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isClickable = visitedSteps?.has(step.id) && !isActive;

            return (
              <div key={step.id} className="flex items-start gap-3">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:border-green-600'
                      : isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100'
                      : isClickable
                      ? 'border-blue-400 bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 hover:border-blue-500'
                      : 'border-gray-300 bg-gray-50 text-gray-400'
                  )}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Content */}
                <div 
                  className={cn(
                    "flex-1 min-w-0",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                >
                  <div
                    className={cn(
                      'font-medium transition-colors',
                      isCompleted
                        ? 'text-green-700 hover:text-green-800'
                        : isActive
                        ? 'text-blue-600'
                        : isClickable
                        ? 'text-blue-600 hover:text-blue-700'
                        : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      'text-sm mt-1 transition-colors',
                      isActive ? 'text-gray-600' : 'text-gray-400'
                    )}
                  >
                    {step.description}
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <ChevronRight className="h-5 w-5 text-blue-500 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Version - Horizontal Layout */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isClickable = visitedSteps?.has(step.id) && !isActive;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Container */}
                <div 
                  className={cn(
                    "flex flex-col items-center flex-1",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all mb-3',
                      isCompleted
                        ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-100 hover:bg-green-600 hover:border-green-600'
                        : isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100 ring-4 ring-blue-100'
                        : isClickable
                        ? 'border-blue-400 bg-blue-100 text-blue-700 shadow-lg shadow-blue-50 hover:bg-blue-200 hover:border-blue-500'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <span className="text-base">{step.id}</span>
                    )}
                  </div>

                  {/* Step Labels */}
                  <div className="text-center max-w-32">
                    <div
                      className={cn(
                        'font-medium text-sm mb-1 transition-colors',
                        isCompleted
                          ? 'text-green-700 hover:text-green-800'
                          : isActive
                          ? 'text-blue-600'
                          : isClickable
                          ? 'text-blue-600 hover:text-blue-700'
                          : 'text-gray-500'
                      )}
                    >
                      {step.title}
                    </div>
                    <div
                      className={cn(
                        'text-xs transition-colors leading-tight',
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      )}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 px-4 -mt-8">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-colors',
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
