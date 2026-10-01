import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Calls `onLoadMore` when the returned ref's element comes within
 * `rootMargin` of the scroll area (`root`, or the viewport when null), while
 * `enabled`. Pair it with a visible "load more" control: an observer is a
 * convenience for a pointer, never the only way to reach older rows.
 */
export function useLoadMoreOnScroll<T extends Element>({
	enabled,
	onLoadMore,
	root = null,
	rootMargin = '200px',
}: {
	enabled: boolean
	onLoadMore: () => void
	root?: Element | null
	rootMargin?: string
}) {
	const [node, setNode] = useState<T | null>(null)
	const latest = useRef(onLoadMore)
	latest.current = onLoadMore

	useEffect(() => {
		if (!enabled || !node || typeof IntersectionObserver === 'undefined') {
			return
		}
		const observer = new IntersectionObserver(
			entries => {
				if (entries.some(entry => entry.isIntersecting)) latest.current()
			},
			{ root, rootMargin },
		)
		observer.observe(node)
		return () => observer.disconnect()
	}, [enabled, node, root, rootMargin])

	return useCallback((element: T | null) => setNode(element), [])
}
