'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { SunnsteelLockup } from '@/components/brand/sunnsteel-lockup'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import {
	Dialog,
	DialogClose,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

import { LanguageSwitch } from './language-switch'
import { SITE_NAV_GROUPS as GROUPS } from './site-nav-groups'

/**
 * SITE-01 §12.1, below 1024: the bar's menu, the whole screen in the Night
 * tokens, fading in as Boostcamp's does (the owner, 2026-11-23) under a copy
 * of the bar whose menu button has become the close button (Radix Dialog:
 * focus moves in, Escape closes it, focus returns to the button). Sign in
 * leads it (the owner, 2026-11-23); the Product panel's three columns become
 * accordion groups, and Pricing and the language switch follow. Get started
 * stays the bar's one filled control.
 */

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
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className="site dark site-menu-panel"
				>
					{/* The bar again, as Boostcamp's menu keeps its own: the lockup
					    where it was and the close button where the menu button was,
					    so the panel reads as the bar opening downward. */}
					<div className="site-menu-top">
						<DialogTitle className="sr-only">{t('menuTitle')}</DialogTitle>
						<DialogClose asChild>
							<Link href="/" aria-label={t('home')} className="text-foreground">
								<SunnsteelLockup
									className="site-lockup"
									markClassName="site-lockup-mark"
								/>
							</Link>
						</DialogClose>
						<DialogClose
							aria-label={t('closeMenu')}
							className="site-menu-close grid size-11 place-items-center text-foreground"
						>
							<X className="size-[22px]" aria-hidden />
						</DialogClose>
					</div>
					<div className="site-menu-body">
						{/* First, not at the foot: a member coming back looks for it
						    before anything else, and a phone's toolbar can cover the
						    bottom. */}
						<DialogClose asChild>
							<Link
								href="/login"
								className="type-action flex h-12 w-full items-center justify-center rounded-sm border border-rule text-foreground hover:bg-surface"
							>
								{t('signIn')}
							</Link>
						</DialogClose>
						<nav aria-label={t('navLabel')} className="mt-2">
							<Accordion type="single" collapsible>
								{GROUPS.map(group => (
									<AccordionItem
										key={group.id}
										value={group.id}
										className="border-rule-faint"
									>
										<AccordionTrigger className="min-h-14">
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
									className="type-action flex min-h-14 items-center border-b border-rule-faint"
								>
									{t('pricing')}
								</Link>
							</DialogClose>
							<div className="flex min-h-14 items-center justify-between border-b border-rule-faint">
								<span className="type-label text-ink-2">{t('language')}</span>
								<LanguageSwitch
									label={t('language')}
									names={{ en: t('english'), es: t('spanish') }}
								/>
							</div>
						</nav>
					</div>
				</DialogPrimitive.Content>
			</DialogPortal>
		</Dialog>
	)
}
