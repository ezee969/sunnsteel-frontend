'use client'

import { Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { ReactNode, Suspense, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TopProgressBar } from '@/components/ui/top-progress-bar'
import { InitialLoadAnimation } from '@/features/initial-load-animation/InitialLoadAnimation'
import Header from '@/features/shell/components/Header'
import Sidebar from '@/features/shell/components/Sidebar'
import { StaleSessionRecoveryDialog } from '@/features/workout/stale-session-recovery-dialog'
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
		if (path.startsWith('/workouts/history')) return 'history'
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
			<div className="relative flex min-h-screen items-center justify-center bg-background p-6">
				<div
					role={sessionCleanupError ? 'alert' : 'status'}
					className="w-full max-w-md space-y-4 rounded-sm border border-rule bg-surface p-6 text-center"
				>
					<h1 className="type-section text-foreground">
						{sessionCleanupError
							? 'Session cleanup needs one more step'
							: 'Finishing session cleanup…'}
					</h1>
					<p className="text-sm text-ink-2">
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
		return <div className="relative min-h-screen bg-background" />
	}

	const layoutContent = (
		<div className="relative min-h-screen">
			<StaleSessionRecoveryDialog session={activeSession} />
			{/* Ground. v1.0 §1.4 retires the gold mesh gradient and the parchment
			    wash: the identity is carried by structure, not by texture behind
			    the content. One flat surface, both themes. */}
			<div className="absolute inset-0 -z-10 bg-background" />
			<div className="flex h-screen">
				{isMobile && isMobileMenuOpen && (
					<div
						className="fixed inset-0 z-50 touch-none bg-scrim"
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
						// `min-w-0` is load-bearing: the sidebar is `fixed`, so it takes no
						// flow width, yet this column is `flex-1` inside a viewport-wide
						// flex row AND carries `ml-64`. Without it the column keeps its
						// full-viewport basis and the margin pushes the document 122px
						// past the viewport at 768-1023. Pre-existing; measured on a
						// clean tree at 890px against a 768px viewport.
						'flex min-h-0 w-full min-w-0 flex-1 flex-col transition-all duration-300',
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
									variant="default"
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
