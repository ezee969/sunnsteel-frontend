'use client'

import dynamic from 'next/dynamic'

const DynamicPerformanceDebugPanel = dynamic(
	() =>
		import('@/components/PerformanceDebugPanel').then(
			m => m.PerformanceDebugPanel,
		),
	{ ssr: false },
)

type Props = {
	showPerfPanel: boolean
}

export default function DevInjections({ showPerfPanel }: Props) {
	return <>{showPerfPanel ? <DynamicPerformanceDebugPanel /> : null}</>
}
