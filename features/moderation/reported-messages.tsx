'use client'

import type {
	ModerationReport,
	ReportedMessageContext,
} from '@sunsteel/contracts'
import { Flag } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { capturedAuthorName } from '@/lib/utils/moderation'

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	dateStyle: 'medium',
	timeStyle: 'short',
}

/**
 * MSG-09: what a message report captured -- the reported message and up to
 * five before it, as the reporter could see them when they filed it -- shown
 * on the queue row once the logged view has answered. It is the whole of what
 * a reviewer reads of a conversation, so it is a §11.5 ruled list like the
 * thread itself, oldest first, with the reported message marked by a glyph
 * and a word, never colour alone.
 */
export function ReportedMessages({
	report,
	context,
}: {
	report: ModerationReport
	context: ReportedMessageContext
}) {
	const t = useTranslations('social.moderationPage')
	const locale = useLocale() as Locale
	const format = dateFormatter(locale, TIME_OPTIONS)

	return (
		<section
			aria-label={t('readMessages')}
			className="border-l-2 border-rule pl-3"
		>
			<p className="type-body-sm text-ink-3">
				{t('capturedHeading', {
					date: format.format(new Date(context.capturedAt)),
				})}
			</p>
			<ol>
				{context.messages.map(message => (
					<li key={message.id} className="rule-row py-2">
						<p className="flex flex-wrap items-baseline gap-x-2">
							<span className="type-panel text-foreground">
								{capturedAuthorName(message, report, context)}
							</span>
							<span className="type-body-sm text-ink-3">
								{message.fromReporter
									? t('capturedFromReporter')
									: t('capturedFromAuthor')}
							</span>
							<time
								dateTime={message.createdAt}
								className="type-body-sm text-ink-3"
							>
								{format.format(new Date(message.createdAt))}
							</time>
							{message.isReported ? (
								<span className="type-body-sm inline-flex items-center gap-1 text-foreground">
									<Flag className="size-3.5" aria-hidden />
									{t('capturedReported')}
								</span>
							) : null}
						</p>
						{message.body !== null ? (
							<p className="type-body whitespace-pre-wrap break-words text-foreground">
								{message.body}
							</p>
						) : typeof message.routineName === 'string' ? null : (
							<p className="type-body-sm text-ink-3">
								{message.deleted ? t('capturedDeleted') : t('capturedRemoved')}
							</p>
						)}
						{/* MSG-07: a routine it carried, by the name the reporter saw. */}
						{typeof message.routineName === 'string' ? (
							<p className="type-body-sm text-ink-2">
								{message.routineName
									? t('capturedRoutine', { name: message.routineName })
									: t('capturedRoutineGone')}
							</p>
						) : null}
					</li>
				))}
			</ol>
		</section>
	)
}
