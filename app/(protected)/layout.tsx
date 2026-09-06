'use client'

import { Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'

import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay'
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TopProgressBar } from '@/components/ui/top-progress-bar'
import { InitialLoadAnimation } from '@/features/initial-load-animation/InitialLoadAnimation'
import Header from '@/features/shell/components/Header'
import Sidebar from '@/features/shell/components/Sidebar'
import { useSidebar } from '@/hooks/use-sidebar'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { cn } from '@/lib/utils'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

interface DashboardLayoutProps {
	children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const pathname = usePathname()
	const router = useRouter()
	const {
		session,
		user,
		error: authError,
		isLoading,
		isSessionCleanupPending,
		sessionCleanupError,
		retrySessionCleanup,
	} = useSupabaseAuth()
	const {
		isSidebarOpen,
		setIsSidebarOpen,
		isMobile,
		isMobileMenuOpen,
		setIsMobileMenuOpen,
	} = useSidebar()

	// Determine active nav based on current pathname
	const getActiveNavFromPath = (path: string) => {
		if (path.startsWith('/dashboard')) return 'dashboard'
		if (path.startsWith('/workouts')) return 'workouts'
		if (path.startsWith('/routines')) return 'routines'
		if (path.startsWith('/settings')) return 'settings'
		return 'dashboard' // fallback
	}

	// Compute header title based on pathname
	const getTitleFromPath = (path: string) => {
		if (path.startsWith('/workouts/sessions')) return 'Active Session'
		if (path.startsWith('/workouts/history')) return 'Workout History'
		if (path.startsWith('/workouts')) return 'Workouts'
		if (path.startsWith('/routines/new')) return 'New Routine'
		if (path.startsWith('/routines/edit')) return 'Edit Routine'
		if (path.startsWith('/routines')) return 'Routines'
		if (path.startsWith('/settings')) return 'Profile Settings'
		if (path.startsWith('/dashboard')) return 'Dashboard'
		return 'Dashboard'
	}

	const [activeNav, setActiveNav] = useState(() =>
		getActiveNavFromPath(pathname),
	)
	const { data: activeSession } = useActiveSession()
	const [isNavActive, setIsNavActive] = useState(false)

	const isOnSessionPage = pathname.startsWith('/workouts/sessions/')

	// Client-side protection for all routes under (protected).
	// The Supabase session alone decides whether we stay: it is what authorizes
	// every API request. The backend verification is only allowed to kick us out
	// when it has actually failed (expired token, account conflict) — waiting for
	// it to succeed would put a round trip in front of the first render (TD-18).
	useEffect(() => {
		if (isLoading) return
		if (!session || (authError && !user)) {
			router.replace('/login')
		}
	}, [session, user, authError, isLoading, router])

	// Update activeNav when pathname changes and stop progress once the route resolves
	useEffect(() => {
		setActiveNav(getActiveNavFromPath(pathname))
		// Finish navigation progress shortly after route resolves
		const done = setTimeout(() => setIsNavActive(false), 300)
		return () => clearTimeout(done)
	}, [pathname])

	// Route chunks are pulled in by next/link prefetch and by the per-component
	// `preloadOnHover` helpers. Eagerly importing every page module here cost
	// bandwidth on cold start for routes the user may never visit.

	// Remove loading state handling - use loading.tsx files instead

	// While determining/redirecting auth state, render a stable empty shell.
	// Gated on `session`, not on the verified profile: children mount (and their
	// queries fire) as soon as we have a token to send.
	if (isSessionCleanupPending || sessionCleanupError) {
		return (
			<div className="relative flex min-h-screen items-center justify-center p-6">
				<div className="absolute inset-0 -z-10 overflow-hidden">
					<ParchmentOverlay opacity={0.06} />
					<GoldVignetteOverlay intensity={0.06} />
				</div>
				<div
					role={sessionCleanupError ? 'alert' : 'status'}
					className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg"
				>
					<h1 className="heading-classical text-xl font-semibold">
						{sessionCleanupError
							? 'Session cleanup needs one more step'
							: 'Finishing session cleanup…'}
					</h1>
					<p className="text-sm text-muted-foreground">
						{sessionCleanupError
							? 'This browser could not clear its routing session. Check your connection and try again.'
							: 'Clearing this browser session securely.'}
					</p>
					{sessionCleanupError && (
						<Button onClick={retrySessionCleanup}>Try again</Button>
					)}
				</div>
			</div>
		)
	}

	if (isLoading || !session) {
		return (
			<div className="relative min-h-screen">
				<div className="absolute inset-0 -z-10 overflow-hidden">
					<ParchmentOverlay opacity={0.06} />
					<GoldVignetteOverlay intensity={0.06} />
				</div>
			</div>
		)
	}

	const layoutContent = (
		<div className="relative min-h-screen">
			{/* Background */}
			<div className="absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute inset-0 bg-white dark:bg-neutral-950 transition-colors duration-300" />
				{/* Modern Brand Mesh Gradient */}
				<div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#daa520,transparent_50%)]" />
					<div className="absolute inset-0 bg-[grid_32px_32px_rgba(0,0,0,0.02)] dark:bg-[grid_32px_32px_rgba(255,255,255,0.02)]" />
				</div>
				<ParchmentOverlay opacity={0.04} />
			</div>
			<div className="flex h-screen">
				{isMobile && isMobileMenuOpen && (
					<div
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-none"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
				)}
				<Sidebar
					isMobile={isMobile}
					isSidebarOpen={isSidebarOpen}
					isMobileMenuOpen={isMobileMenuOpen}
					activeNav={activeNav}
					setActiveNav={setActiveNav}
					setIsSidebarOpen={setIsSidebarOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
					onNavigateStart={() => setIsNavActive(true)}
				/>
				{/* Main Content */}
				<div
					className={cn(
						'flex min-h-0 flex-col flex-1 transition-all duration-300',
						isMobile ? 'ml-0 w-full' : isSidebarOpen ? 'ml-64' : 'ml-20',
					)}
				>
					{/* Top progress bar for immediate feedback */}
					<TopProgressBar active={isNavActive} />
					<Header
						title={getTitleFromPath(pathname)}
						isMobile={isMobile}
						setIsMobileMenuOpen={setIsMobileMenuOpen}
					/>
					{!isOnSessionPage && activeSession?.id && (
						<div className="px-3 sm:px-6 mt-2">
							<div className="rounded-md border bg-primary/5 p-1 sm:p-2 flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm">
									<Dumbbell className="h-3 w-3" />
									<span>Active workout session in progress.</span>
								</div>
								<Button
									asChild
									size="sm"
									variant="classical"
									aria-label="Resume active session"
								>
									<Link href={`/workouts/sessions/${activeSession.id}`}>
										Resume
									</Link>
								</Button>
							</div>
						</div>
					)}

					{/* Content */}
					<main className="flex-1 overflow-auto p-3 sm:p-6">
						<Suspense
							fallback={
								<div className="w-full max-w-lg space-y-3 p-6">
									<Skeleton className="h-6 w-40" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-4 w-5/6" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							}
						>
							<div
								className={cn('h-full transition-all duration-300 ease-out')}
							>
								{children}
							</div>
						</Suspense>
					</main>
				</div>
			</div>
		</div>
	)

	return <InitialLoadAnimation>{layoutContent}</InitialLoadAnimation>
}
