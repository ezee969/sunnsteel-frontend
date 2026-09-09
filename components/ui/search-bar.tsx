'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { useUserSearch } from '@/lib/api/hooks/useUserSearch'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Input } from './input'

export function SearchBar() {
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const [isFocused, setIsFocused] = useState(false)
	const router = useRouter()
	const containerRef = useRef<HTMLDivElement>(null)

	// Custom debounce hook natively
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query)
		}, 300)
		return () => clearTimeout(handler)
	}, [query])

	const { data: results = [], isLoading } = useUserSearch(debouncedQuery)

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsFocused(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (debouncedQuery.trim().length > 0) {
			router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`)
			setIsFocused(false)
		}
	}

	const handleSelectUser = (username: string) => {
		// Navigate directly to the selected user's profile
		router.push(`/profile/${encodeURIComponent(username)}`)
		setIsFocused(false)
	}

	const showDropdown = isFocused && debouncedQuery.length >= 2

	return (
		<div className="relative w-full max-w-sm" ref={containerRef}>
			<form onSubmit={handleSearchSubmit} className="relative group">
				<Search
					className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard group-focus-within:text-foreground"
					aria-hidden
				/>
				{/* The field takes the primitive's own boundary (§11.6). It was a
				    translucent pill with a `--primary`-tinted border and ring, which
				    made the one search field in the app the only control that did not
				    look like the rest of them. */}
				<Input
					type="text"
					placeholder="Search by name or @username..."
					className="w-full pl-9 pr-10"
					value={query}
					onChange={e => setQuery(e.target.value)}
					onFocus={() => setIsFocused(true)}
				/>
				{isLoading && (
					<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ink-3" />
				)}
			</form>

			<AnimatePresence>
				{showDropdown && (
					// §11.9/§8 — an overlay separates by shadow in light, by scrim and
					// a 1px rule in dark. Nothing here is translucent or blurred.
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
						className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-md border border-rule bg-popover text-popover-foreground shadow-overlay dark:shadow-none"
					>
						{results.length > 0 ? (
							<div className="flex max-h-[300px] flex-col overflow-y-auto py-2">
								<span className="type-label mb-1 px-3 text-ink-3">
									Top Results
								</span>
								{results.map(
									(
										user: import('@/lib/api/services/userService').UserSearchResponse,
									) => (
										<button
											key={user.id}
											type="button"
											onClick={() => handleSelectUser(user.username)}
											className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-muted"
										>
											<Avatar className="h-8 w-8 border border-rule">
												<AvatarImage src={user.avatarUrl || ''} />
												<AvatarFallback className="type-body-sm bg-surface-sunk text-ink-2">
													{user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col overflow-hidden">
												<span className="type-panel truncate text-foreground">
													{user.name} {user.lastName || ''}
												</span>
												<span className="type-body-sm truncate text-ink-3">
													@{user.username}
												</span>
											</div>
										</button>
									),
								)}
								<div
									className="type-body-sm mt-1 cursor-pointer border-t border-rule-faint px-3 py-2 text-center text-ink-2 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-muted hover:text-foreground"
									onClick={e => {
										e.preventDefault()
										handleSearchSubmit(e as unknown as React.FormEvent)
									}}
								>
									View all results for &quot;{debouncedQuery}&quot;
								</div>
							</div>
						) : (
							!isLoading && (
								<div className="type-body-sm p-4 text-center text-ink-3">
									No users found for &quot;{debouncedQuery}&quot;
								</div>
							)
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
