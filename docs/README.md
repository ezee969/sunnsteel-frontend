# Frontend Docs Index

| Area | Path | Purpose | Status
|-----|------|---------|-------
|RtF Roadmap | roadmaps/RTF_ENHANCEMENTS.md | Active & planned frontend RtF tasks | ✅ COMPLETE (16/16)
|RtF History | history/RTF_IMPLEMENTATION_COMPLETION.md | Initial implementation snapshot | ✅ Complete
|RtF Completion | history/RTF_FRONTEND_COMPLETION_2025-01-23.md | Final completion report | ✅ New
|Frontend Improvements | roadmaps/FRONTEND_IMPROVEMENTS.md | Quick-win improvement tasks & UX enhancements | 🟡 Active
|Frontend Architecture | reference/frontend-architecture.md | Current feature-based module layout & placement rules | ✅ New
|Auth & Security | auth-security-implementation.md | Auth flow, middleware cookies, OAuth callback and redirects | ✅ Updated
|Documentation Templates | templates/ | Standardized templates for components, hooks, APIs, and ADRs | ✅ New

## Major Milestones

### RTF Platform (100% Complete) ✅
- **16/16 tasks implemented**: Complete Reps-to-Failure analytics platform
- **Technical excellence**: ETag caching, IndexedDB offline storage, comprehensive test coverage
- **Performance optimized**: 372kB build size, sub-second load times, responsive design

### Next Focus Areas
- Frontend Improvements roadmap (quick-wins and UX enhancements)
- Future feature development based on user feedback

Conventions:
- Roadmaps: `docs/roadmaps/*`
- Historical completion reports: `docs/history/*`

This index will expand as additional feature domains gain dedicated docs.

## Hydration-Safe Client UI Elements

Some UI elements that rely on client-only APIs (e.g. `crypto.randomUUID()` in
the toast system or time-based mutation) are deferred until after mount to
avoid React hydration mismatch warnings. Example: the toast container now
checks `mounted` (via `useEffect`) and adds `suppressHydrationWarning` to the
container root. If adding new ephemeral UI containers (portals, overlays,
notifications) follow the same pattern:

1. Render nothing until `mounted === true`.
2. Avoid invoking non-deterministic functions during SSR.
3. Add `suppressHydrationWarning` only at the minimal element boundary.
4. Keep accessible live region attributes (`aria-live`, `aria-relevant`) on the
	client-rendered element once mounted.

This keeps server HTML stable while preserving accessibility semantics.
