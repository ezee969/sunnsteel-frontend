"use client"

import dynamic from 'next/dynamic'

const DynamicPerformanceDebugPanel = dynamic(
	() =>
		import('@/components/PerformanceDebugPanel').then(
			m => m.PerformanceDebugPanel
		),
	{ ssr: false }
)

const DynamicEruda = dynamic(
	() => import('@/components/Eruda').then(m => m.Eruda),
	{ ssr: false }
)

type Props = {
	showPerfPanel: boolean
	enableEruda: boolean
}

export default function DevInjections({ showPerfPanel, enableEruda }: Props) {
	return (
		<>
			{showPerfPanel ? <DynamicPerformanceDebugPanel /> : null}
			{enableEruda ? <DynamicEruda /> : null}
		</>
	)
}
