'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { intlLocale } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import { weekdayName } from '@/lib/utils/date'

import type { TrainingDayInfo } from '../constants/training-days'

interface TrainingDayButtonProps {
	readonly day: TrainingDayInfo
	readonly isSelected: boolean
	readonly isLocked: boolean
	readonly isMobile: boolean
	readonly onToggle: (dayId: number) => void
}

export const TrainingDayButton = ({
	day,
	isSelected,
	isLocked,
	isMobile,
	onToggle,
}: TrainingDayButtonProps) => {
	const t = useTranslations('routines.trainingDays')
	const tDate = useTranslations('routines.date')
	const locale = useLocale()
	const short = weekdayName(day.id, 'short', tDate)
	const long = weekdayName(day.id, 'long', tDate)
	return (
		<Button
			variant={isSelected ? 'default' : 'outline'}
			onClick={() => onToggle(day.id)}
			disabled={isLocked}
			className={cn(
				'flex flex-col h-auto p-1.5 md:p-3 text-xs md:text-sm relative',
				isMobile && 'h-10 w-10 p-0 flex items-center justify-center',
				isLocked &&
					'bg-primary text-primary-foreground cursor-not-allowed opacity-90',
			)}
			size={isMobile ? 'icon' : 'sm'}
			title={isLocked ? t('lockedDay') : undefined}
		>
			{isMobile ? (
				<span className="font-medium text-xs">
					{short.charAt(0).toLocaleUpperCase(intlLocale(locale))}
				</span>
			) : (
				<>
					<span className="font-medium">{short}</span>
					<span className="hidden text-xs sm:block">
						{long.substring(0, 3)}
					</span>
				</>
			)}
			{isLocked && (
				<div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-none bg-warning-strong">
					<span className="text-[8px] leading-none">🔒</span>
				</div>
			)}
		</Button>
	)
}
