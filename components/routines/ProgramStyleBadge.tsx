import { Badge } from '@/components/ui/badge'
import { Dumbbell, Target } from 'lucide-react'

interface ProgramStyleBadgeProps {
	style: 'STANDARD' | 'HYPERTROPHY' | null | undefined
	variant?: 'default' | 'secondary' | 'outline'
}

export default function ProgramStyleBadge({ 
	style, 
	variant = 'outline' 
}: ProgramStyleBadgeProps) {
	if (!style || style === null) {
		return null
	}

	const isHypertrophy = style === 'HYPERTROPHY'

	return (
		<Badge 
			variant={variant} 
			className="flex items-center gap-1"
		>
			{isHypertrophy ? (
				<Target className="h-3 w-3" aria-hidden />
			) : (
				<Dumbbell className="h-3 w-3" aria-hidden />
			)}
			<span>
				{isHypertrophy ? 'Hypertrophy' : 'Standard'} RtF
			</span>
		</Badge>
	)
}