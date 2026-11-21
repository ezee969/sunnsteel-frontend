'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	Dialog,
	DialogClose,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import { LanguageSwitch } from './language-switch'

/**
 * SITE-01 §12.1, below 768: the bar's menu, a full-height panel from the
 * right over the scrim (Radix Dialog: focus moves in, Escape and the scrim
 * close it, focus returns to the button). The Product panel's three columns
 * become accordion groups; Pricing, the language switch and Sign in follow.
 * Get started stays the bar's one filled control.
 */
const GROUPS = [
	{
		id: 'features',
		links: [
			['allFeatures', '/features'],
			['workoutTracker', '/features/workout-tracker'],
			['routineBuilder', '/features/routine-builder'],
			['progression', '/features/progression'],
			['progress', '/features/progress'],
			['ranks', '/features/ranks'],
			['community', '/features/community'],
		],
	},
	{
		id: 'useCases',
		links: [
			['beginners', '/use-cases/beginners'],
			['intermediates', '/use-cases/intermediates'],
			['advanced', '/use-cases/advanced'],
		],
	},
	{
		id: 'plans',
		links: [
			['pricing', '/pricing'],
			['isItFree', '/pricing#free'],
			['pro', '/pricing#pro'],
			['install', '/#install'],
		],
	},
] as const

export function SiteMenu() {
	const t = useTranslations('site.topBar')
	return (
		<Dialog>
			<DialogTrigger
				aria-label={t('openMenu')}
				className="site-menu-button grid size-11 place-items-center text-foreground"
			>
				<Menu className="size-[22px]" aria-hidden />
			</DialogTrigger>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className="site dark site-menu-panel data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-standard"
				>
					<div className="flex h-14 items-center justify-between px-4">
						<DialogTitle className="type-label text-ink-2">
							{t('menuTitle')}
						</DialogTitle>
						<DialogClose
							aria-label={t('closeMenu')}
							className="grid size-11 place-items-center text-foreground"
						>
							<X className="size-[22px]" aria-hidden />
						</DialogClose>
					</div>
					<nav
						aria-label={t('navLabel')}
						className="flex-1 overflow-y-auto px-4"
					>
						<Accordion type="single" collapsible>
							{GROUPS.map(group => (
								<AccordionItem
									key={group.id}
									value={group.id}
									className="border-rule-faint"
								>
									<AccordionTrigger className="min-h-11">
										{t(`columns.${group.id}`)}
									</AccordionTrigger>
									<AccordionContent>
										<ul className="flex flex-col">
											{group.links.map(([key, href]) => (
												<li key={key}>
													<DialogClose asChild>
														<Link
															href={href}
															className="type-action flex min-h-11 items-center text-ink-2 hover:text-foreground"
														>
															{t(`links.${key}`)}
														</Link>
													</DialogClose>
												</li>
											))}
										</ul>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
						<DialogClose asChild>
							<Link
								href="/pricing"
								className="type-action flex min-h-11 items-center border-b border-rule-faint"
							>
								{t('pricing')}
							</Link>
						</DialogClose>
						<div className="flex min-h-11 items-center justify-between border-b border-rule-faint">
							<span className="type-label text-ink-2">{t('language')}</span>
							<LanguageSwitch
								label={t('language')}
								names={{ en: t('english'), es: t('spanish') }}
							/>
						</div>
					</nav>
					<div className="p-4">
						<DialogClose asChild>
							<Link
								href="/login"
								className="type-action flex h-12 w-full items-center justify-center rounded-sm border border-rule text-foreground hover:bg-surface"
							>
								{t('signIn')}
							</Link>
						</DialogClose>
					</div>
				</DialogPrimitive.Content>
			</DialogPortal>
		</Dialog>
	)
}
