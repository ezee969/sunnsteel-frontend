'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

interface SessionActionCardProps {
	/** LIVE-22: every required set is done, so Finish becomes the one filled control. */
	canFinish: boolean
	isFinishing: boolean
	onFinishAttempt: () => void
	onDiscardAttempt: () => void
}

/**
 * The workout's terminal actions, after the work (design system §27.5).
 *
 * LIVE-22: they used to sit above the first exercise, with Finish filled from
 * the first set and a "Complete all sets" notice before anything was logged,
 * so the screen's strongest control was the one that ends the workout. They
 * now follow the exercises and the workout note. Finish is here below `md`
 * and in the masthead from it; it is outline while required sets remain --
 * the confirmation still says what is left -- and filled once they are done.
 * Discard destroys data, so it is the destructive outline (§4.3 rule 5).
 */
export const SessionActionCard = ({
	canFinish,
	isFinishing,
	onFinishAttempt,
	onDiscardAttempt,
}: SessionActionCardProps) => {
	const t = useTranslations('workout.sessionActionCard')

	return (
		<section
			aria-label={t('actionsLabel')}
			className="flex flex-wrap items-center gap-2 border-t border-rule pt-4"
		>
			<Button
				type="button"
				variant={canFinish ? 'default' : 'outline'}
				onClick={onFinishAttempt}
				disabled={isFinishing}
				className="h-11 flex-1 md:hidden large-controls:h-12"
			>
				{isFinishing ? t('finishing') : t('finishSession')}
			</Button>
			<Button
				type="button"
				variant="destructive"
				onClick={onDiscardAttempt}
				disabled={isFinishing}
				className="h-11 md:h-10 max-sm:px-3"
			>
				<Trash2 className="h-4 w-4" aria-hidden />
				{t('discard')}
			</Button>
		</section>
	)
}
