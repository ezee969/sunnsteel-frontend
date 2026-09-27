'use client'

import type { ProfilePrivacySettings } from '@sunsteel/contracts'
import Link from 'next/link'

import { privacySettingHref } from '@/lib/utils/settings-anchor'

const LINK_CLASS = 'text-foreground underline underline-offset-4'

type PrivacyCapNoteProps = {
	/** Why a choice reaches fewer people than asked, already worded. */
	text: string
	/** The profile section whose privacy capped it; null prints no link. */
	section: keyof ProfilePrivacySettings | null
	/**
	 * On Settings itself the link is a same-page fragment, so the browser's own
	 * jump and `useScrollToHash`'s focus both run without a navigation.
	 */
	withinSettings?: boolean
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
	withinSettings = false,
	className,
	role,
}: PrivacyCapNoteProps) {
	const href = section ? privacySettingHref(section) : null
	return (
		<p role={role} className={className}>
			{text}
			{href ? (
				<>
					{' '}
					{withinSettings ? (
						<a href={href.replace('/settings', '')} className={LINK_CLASS}>
							Change it under Profile Privacy
						</a>
					) : (
						<Link href={href} className={LINK_CLASS}>
							Change it in Settings
						</Link>
					)}
					.
				</>
			) : null}
		</p>
	)
}
