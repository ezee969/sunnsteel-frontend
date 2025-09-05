'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, ChevronRight } from 'lucide-react';

export default function WorkoutsIndexPage() {
  const router = useRouter();
  const { data: active, isLoading } = useActiveSession();

  useEffect(() => {
    if (active?.id) {
      router.replace(`/workouts/sessions/${active.id}`);
    }
  }, [active?.id, router]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Dumbbell className="h-5 w-5 animate-pulse" />
          <span>Loading your workouts...</span>
        </div>
      </div>
    );
  }

  // If there is an active session, we'll navigate away; render a lightweight fallback meanwhile
  if (active?.id) {
    return (
      <div className="flex h-[calc(100vh-300px)] items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Redirecting to your active session…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardDescription>No active workout session found.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start a new workout from one of your routines. You can begin with the
            first day or pick a specific day from the routine dropdown.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/routines">
                <Dumbbell className="mr-2 h-4 w-4" />
                Go to Routines
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workouts/history">View History</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
