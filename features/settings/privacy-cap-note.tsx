'use client'

import type { ProfilePrivacySettings } from '@sunsteel/contracts'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { privacySettingHref } from '@/lib/utils/settings-anchor'

const LINK_CLASS = 'text-foreground underline underline-offset-4'

type PrivacyCapNoteProps = {
	/** Why a choice reaches fewer people than asked, already worded. */
	text: string
	/** The profile section whose privacy capped it; null prints no link. */
	section: keyof ProfilePrivacySettings | null
	className?: string
	role?: 'status'
}

/**
 * A privacy cap followed by a link to the one setting that changes it
 * (UX-08), instead of telling the owner to go and find it.
 */
export function PrivacyCapNote({
	text,
	section,
	className,
	role,
}: PrivacyCapNoteProps) {
	const pathname = usePathname()
	const href = section ? privacySettingHref(section) : null
	// On Settings › Privacy itself the link is a same-page fragment, so the
	// browser's own jump and `useScrollToHash`'s focus both run without a
	// navigation; from another Settings tab it names Profile Privacy (UX-12).
	const [path, fragment] = href ? href.split('#') : ['', '']
	const samePage = pathname === path
	const inSettings = pathname?.startsWith('/settings') ?? false
	return (
		<p role={role} className={className}>
			{text}
			{href ? (
				<>
					{' '}
					{samePage ? (
						<a href={`#${fragment}`} className={LINK_CLASS}>
							Change it under Profile Privacy
						</a>
					) : (
						<Link href={href} className={LINK_CLASS}>
							{inSettings
								? 'Change it under Profile Privacy'
								: 'Change it in Settings'}
						</Link>
					)}
					.
				</>
			) : null}
		</p>
	)
}
