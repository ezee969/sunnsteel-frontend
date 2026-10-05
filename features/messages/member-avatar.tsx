import type { ConversationMember } from '@sunsteel/contracts'
import { UserX } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/** MSG-01: the other member's avatar, or a plain mark once they are gone. */
export function MemberAvatar({
	member,
	size = 'md',
}: {
	member: ConversationMember | null
	size?: 'sm' | 'md'
}) {
	const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
	if (!member) {
		return (
			<span
				className={`${box} flex shrink-0 items-center justify-center rounded-full border border-rule bg-surface-sunk`}
			>
				<UserX className="size-4 text-ink-3" aria-hidden />
			</span>
		)
	}
	return (
		<Avatar className={`${box} shrink-0 border border-rule`}>
			<AvatarImage
				src={member.avatarUrl || ''}
				alt=""
				className="object-cover"
			/>
			<AvatarFallback className="type-data bg-surface-sunk text-ink-2">
				{member.name.charAt(0) || member.username.charAt(0)}
			</AvatarFallback>
		</Avatar>
	)
}
