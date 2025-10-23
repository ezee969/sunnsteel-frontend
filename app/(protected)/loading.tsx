import { Skeleton } from '@/components/ui/skeleton';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Background during loading */}
      <div className="absolute inset-0 -z-10">
        <ParchmentOverlay opacity={0.06} />
        <GoldVignetteOverlay intensity={0.06} />
      </div>
      <div className="w-full max-w-lg space-y-3 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
