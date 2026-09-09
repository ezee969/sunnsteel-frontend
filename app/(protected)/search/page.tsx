'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserSearch } from '@/lib/api/hooks/useUserSearch'

export default function SearchPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const query = searchParams.get('q') || ''

	const { data: results = [], isLoading } = useUserSearch(query, 50)

	if (!query) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-surface-sunk">
					<Search className="h-8 w-8 text-ink-3" aria-hidden />
				</div>
				<h2 className="type-section mb-2 text-foreground">Search Users</h2>
				{/* FIX-07: this used to offer search by username and by email.
				Unique handles do not exist yet -- PROF-03 owns them -- and an email
				address is not a public identity, so it is not offered as a way to
				look someone up. */}
				<p className="type-body-sm max-w-md text-ink-3">
					Type a name in the top search bar to find profiles.
				</p>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			{/* This page has no `HeroSection`, so its own heading is the page
			    inscription (§11.11). */}
			<div className="rule-heading pb-4">
				<h1 className="type-page corner-brackets inline-block text-foreground">
					Search Results
				</h1>
				<p className="type-body-sm mt-2 text-ink-3">
					Showing results for{' '}
					<span className="type-data text-foreground">&quot;{query}&quot;</span>
				</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="flex flex-col items-center rounded-sm border border-rule bg-surface p-6"
						>
							<Skeleton className="mb-4 h-20 w-20 rounded-full" />
							<Skeleton className="mb-2 h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					))}
				</div>
			) : results.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{results.map(user => (
						// §9.2 — the per-card stagger, the hover scale, the hover
						// gradient wash and the shadow lift are all gone. A result is a
						// `panel` (§11.5) and hover changes colour only.
						<div
							key={user.id}
							onClick={() => router.push(`/profile/${user.id}`)}
							className="group flex cursor-pointer flex-col items-center rounded-sm border border-rule bg-surface p-6 transition-colors duration-[var(--motion-fast)] ease-standard hover:border-ink-3"
						>
							<Avatar className="mb-4 h-20 w-20 border border-rule">
								<AvatarImage
									src={user.avatarUrl || ''}
									className="object-cover"
								/>
								<AvatarFallback className="type-numeral bg-surface-sunk text-ink-2">
									{user.name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<h3 className="type-panel text-center text-foreground">
								{user.name} {user.lastName || ''}
							</h3>
							{/* A `@handle` belongs here once PROF-03 introduces unique usernames. */}
							<p className="type-body-sm mt-2 text-ink-3">View profile</p>
						</div>
					))}
				</div>
			) : (
				<div className="flex h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-rule p-8 text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-surface-sunk">
						<Search className="h-8 w-8 text-ink-3" aria-hidden />
					</div>
					<h3 className="type-section mb-2 text-foreground">No users found</h3>
					<p className="type-body-sm max-w-sm text-ink-3">
						We couldn&apos;t find any profiles matching &quot;{query}&quot;. Try
						a different spelling or name.
					</p>
				</div>
			)}
		</div>
	)
}
