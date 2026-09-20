import type {
	ComebackRecognition,
	EarnedAchievement,
	PublicProfileAchievements,
} from '@sunsteel/contracts'
import { Award, Check, Medal, RotateCcw } from 'lucide-react'
import Link from 'next/link'

import {
	ACHIEVEMENT_CATEGORY_LABELS,
	formatAchievementDate,
	formatComebackEvidence,
	groupAchievements,
	hasVisibleProfileAchievements,
} from '@/lib/utils/achievements'

interface ProfileAchievementsProps {
	data?: PublicProfileAchievements
	canView: boolean
	isOwnProfile: boolean
}

function MilestoneRow({
	achievement,
	isOwnProfile,
}: {
	achievement: EarnedAchievement
	isOwnProfile: boolean
}) {
	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<Check className="size-4 text-foreground" aria-hidden />
				</span>
				<div className="min-w-0">
					<h4 className="type-panel text-foreground">{achievement.title}</h4>
					<p className="type-body-sm mt-1 text-ink-3">
						{achievement.description}
					</p>
				</div>
			</div>
			<div className="pl-11 sm:pl-0 sm:text-right">
				<p className="type-body-sm text-ink-3">
					{achievement.backfilled
						? 'Recognized from history'
						: `Earned ${formatAchievementDate(achievement.unlockedAt)}`}
				</p>
				{isOwnProfile && achievement.sourceSessionId ? (
					<Link
						href={`/workouts/history/${achievement.sourceSessionId}`}
						className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
					>
						View session
					</Link>
				) : null}
			</div>
		</li>
	)
}

function ComebackRow({
	comeback,
	isOwnProfile,
}: {
	comeback: ComebackRecognition
	isOwnProfile: boolean
}) {
	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<RotateCcw className="size-4 text-ink-3" aria-hidden />
				</span>
				<div className="min-w-0">
					<h4 className="type-panel text-foreground">Comeback recorded</h4>
					<p className="type-data mt-1 text-foreground">
						{formatComebackEvidence(comeback)}
					</p>
				</div>
			</div>
			<div className="pl-11 sm:pl-0 sm:text-right">
				<p className="type-body-sm text-ink-3">
					Recognized {formatAchievementDate(comeback.recognizedAt)}
				</p>
				{isOwnProfile ? (
					<Link
						href={`/workouts/history/${comeback.sourceSessionId}`}
						className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
					>
						View session
					</Link>
				) : null}
			</div>
		</li>
	)
}

export function ProfileAchievements({
	data,
	canView,
	isOwnProfile,
}: ProfileAchievementsProps) {
	const groups = groupAchievements(data?.achievements ?? [])
	const comebacks = data?.comeback?.recognitions ?? []

	return (
		<section
			id="achievements"
			aria-labelledby="profile-achievements"
			className="scroll-mt-24 space-y-5"
		>
			<h2
				id="profile-achievements"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Award className="size-4 text-ink-3" aria-hidden /> Achievements
			</h2>

			{!canView ? (
				<p className="type-body-sm text-ink-3">Achievements are private.</p>
			) : !hasVisibleProfileAchievements(data) ? (
				<p className="type-body-sm text-ink-3">
					{isOwnProfile
						? 'Complete training to begin your verified achievement ledger.'
						: 'No verified achievements yet.'}
				</p>
			) : (
				<>
					{data?.rank ? (
						<div className="rule-row flex gap-3 py-4">
							<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
								<Award className="size-4 text-ink-3" aria-hidden />
							</span>
							<div>
								<p className="type-body-sm text-ink-3">
									Current Renaissance rank
								</p>
								<h3 className="type-panel text-foreground">
									{data.rank.title}
								</h3>
								<p className="type-body-sm mt-1 text-ink-2">
									{data.rank.description}
								</p>
							</div>
						</div>
					) : null}

					{groups.length ? (
						<div className="space-y-6">
							{groups.map(group => (
								<section
									key={group.category}
									aria-labelledby={`profile-achievement-${group.category}`}
								>
									<div className="flex items-center gap-2 border-b border-rule pb-2">
										<Medal className="size-4 text-ink-3" aria-hidden />
										<h3
											id={`profile-achievement-${group.category}`}
											className="type-panel text-foreground"
										>
											{ACHIEVEMENT_CATEGORY_LABELS[group.category]}
										</h3>
									</div>
									<ul>
										{group.items.map(achievement => (
											<MilestoneRow
												key={achievement.eventId}
												achievement={achievement}
												isOwnProfile={isOwnProfile}
											/>
										))}
									</ul>
								</section>
							))}
						</div>
					) : null}

					{comebacks.length ? (
						<section aria-labelledby="profile-comebacks">
							<div className="flex items-center gap-2 border-b border-rule pb-2">
								<RotateCcw className="size-4 text-ink-3" aria-hidden />
								<h3
									id="profile-comebacks"
									className="type-panel text-foreground"
								>
									Comebacks
								</h3>
							</div>
							<ul>
								{comebacks.map(comeback => (
									<ComebackRow
										key={comeback.id}
										comeback={comeback}
										isOwnProfile={isOwnProfile}
									/>
								))}
							</ul>
							{data?.comeback?.historyTruncated ? (
								<p className="type-body-sm pt-3 text-ink-3">
									Shows comebacks detected in the 500 most recent completed
									sessions.
								</p>
							) : null}
						</section>
					) : null}
				</>
			)}
		</section>
	)
}
