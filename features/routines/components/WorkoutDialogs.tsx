'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface WorkoutDialogsProps {
	// Active session conflict dialog
	activeConflictOpen: boolean
	onActiveConflictClose: () => void
	onGoToActiveSession?: () => void

	// Date validation dialog
	dateValidationOpen: boolean
	onDateValidationClose: () => void

	// Date confirmation dialog
	dateConfirmOpen: boolean
	onDateConfirm: () => void
	onDateConfirmClose: () => void
}

/**
 * Compound component containing all workout-related dialogs
 *
 * Includes:
 * - Active session conflict dialog
 * - Date validation error dialog
 * - Date confirmation dialog for mismatched days
 */
export const WorkoutDialogs = ({
	activeConflictOpen,
	onActiveConflictClose,
	onGoToActiveSession,
	dateValidationOpen,
	onDateValidationClose,
	dateConfirmOpen,
	onDateConfirm,
	onDateConfirmClose,
}: WorkoutDialogsProps) => {
	const t = useTranslations('routines.detail')
	return (
		<>
			{/* Active Session Conflict Dialog */}
			<Dialog open={activeConflictOpen} onOpenChange={onActiveConflictClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('activeSessionTitle')}</DialogTitle>
						<DialogDescription>{t('activeSessionBody')}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={onActiveConflictClose}>
							{t('cancel')}
						</Button>
						{onGoToActiveSession && (
							<Button onClick={onGoToActiveSession}>
								{t('goToActiveSession')}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Date Validation Error Dialog */}
			<Dialog open={dateValidationOpen} onOpenChange={onDateValidationClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('cannotStartTitle')}</DialogTitle>
						<DialogDescription>{t('cannotStartBody')}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={onDateValidationClose}>
							{t('ok')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Date Confirmation Dialog */}
			<Dialog open={dateConfirmOpen} onOpenChange={onDateConfirmClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('confirmDayTitle')}</DialogTitle>
						<DialogDescription>{t('confirmDayBody')}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={onDateConfirmClose}>
							{t('cancel')}
						</Button>
						<Button onClick={onDateConfirm}>{t('startAnyway')}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
