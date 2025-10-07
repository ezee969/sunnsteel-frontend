import { useCallback, useState } from 'react'

interface UseCollapseMapReturn<T extends string | number> {
	collapsed: Record<T, boolean>
	toggle: (key: T) => void
	setCollapsed: (keys: T[], collapsed?: boolean) => void
	isCollapsed: (key: T) => boolean
}

export function useCollapseMap<T extends string | number>(): UseCollapseMapReturn<T> {
	const [state, setState] = useState<Record<T, boolean>>({} as Record<T, boolean>)

	const toggle = useCallback((key: T) => {
		setState((prev) => ({ ...prev, [key]: !prev[key] }))
	}, [])

	const setCollapsed = useCallback((keys: T[], collapsed = true) => {
		setState((prev) => {
			const next = { ...prev }
			keys.forEach((key) => {
				next[key] = collapsed
			})
			return next
		})
	}, [])

	const isCollapsed = useCallback((key: T) => Boolean(state[key]), [state])

	return {
		collapsed: state,
		toggle,
		setCollapsed,
		isCollapsed,
	}
}
