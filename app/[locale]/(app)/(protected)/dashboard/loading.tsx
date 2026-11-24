import DashboardLoading from './components/DashboardLoading'

/**
 * Route-level fallback. Same mark as the client-side loading state, so a
 * navigation into the dashboard shows one continuous loader rather than two
 * different placeholders in a row.
 */
export default function Loading() {
	return <DashboardLoading />
}
