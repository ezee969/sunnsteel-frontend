import { Skeleton } from '@/components/ui/skeleton'

export function ProfileLoading() {
	return (
		<div className="mx-auto w-full max-w-4xl animate-in space-y-6 fade-in duration-500">
			<Skeleton className="h-[200px] w-full rounded-xl" />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Skeleton className="h-[400px] w-full rounded-xl md:col-span-1" />
				<Skeleton className="h-[400px] w-full rounded-xl md:col-span-2" />
			</div>
		</div>
	)
}
