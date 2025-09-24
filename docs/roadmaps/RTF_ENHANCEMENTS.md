# Frontend RtF Enhancements Roadmap

Authoritative tracker for Reps-to-Failure (RtF) frontend enhancements aligned with backend roadmap.

## Legend
Status: Done | In Progress | Planned | Deferred

## Summary Table
Task | Area | Status | Notes
-----|------|--------|------
RTF-F01 | Routine query include goals | Done | ✅ Added `?include=rtfGoals&week=N` support to routineService + useRtFWeekGoals hook
RTF-F02 | Timeline view UI | Done | ✅ Complete RtfTimeline component with week progress, deload highlighting, responsive grid
RTF-F03 | Timeline adapter | Done | ✅ Data normalization utilities: stats calculation, month grouping, phase detection, validation
RTF-F04 | ETag integration layer | Done | ✅ Enhanced HTTP client with cache optimization, invalidation patterns, RTF API wrappers
RTF-F05 | Forecast card | Done | ✅ RtfForecastCard with confidence indicators, expandable predictions, target week support
RTF-F06 | AMRAP perf panel | Done | ✅ AmrapPerformancePanel with target vs actual tracking, trends, confidence indicators
RTF-F07 | Weekly trend charts | Done | ✅ WeeklyTrendCharts with volume, intensity, and AMRAP trends using Recharts
RTF-F08 | Anomaly notification surface | Done | ✅ AnomalyNotificationSurface with alert prioritization and actionable recommendations
RTF-F09 | Program history modal | Done | ✅ ProgramHistoryModal with snapshot versioning and change tracking
RTF-F10 | Offline cache (week goals + timeline) | Done | ✅ IndexedDB cache with TTL, version control, and cache statistics
RTF-F11 | Deload highlight styling | Done | ✅ Integrated in RtfTimeline with ring styling and color coding
RTF-F12 | Forecast deterministic test harness | Done | ✅ Comprehensive test suite with 11 test cases mirroring backend validation
RTF-F13 | useRtFForecast hook | Done | ✅ Abstraction for forecast endpoint with target weeks and ETag caching
RTF-F14 | useRtFTimeline hook | Done | ✅ Abstraction for timeline endpoint with ETag caching
RTF-F15 | useRtFWeekGoals hook | Done | ✅ Include+fallback logic integrated in useRoutines with ETag caching
RTF-F16 | RTF Dashboard integration | Done | ✅ Complete 6-tab dashboard (Overview, Timeline, Forecast, AMRAP, Trends, Insights) in routine details

## Task Status: **COMPLETE** - 16/16 tasks implemented (100% coverage)

All RTF frontend enhancements have been successfully implemented, providing comprehensive RtF analytics platform with advanced features:

### Core Infrastructure (F01-F05)
- **Query optimization**: Include patterns for RTF goals with week-specific filtering
- **Timeline visualization**: Interactive week progress with deload highlighting  
- **Data normalization**: Stats calculation, month grouping, phase detection
- **Caching layer**: ETag-based HTTP client with cache invalidation
- **Forecast predictions**: Confidence indicators and target week support

### Advanced Analytics (F06-F12)  
- **Performance tracking**: AMRAP target vs actual with trend analysis
- **Trend visualization**: Multi-metric charts (volume, intensity, AMRAP)
- **Anomaly detection**: Smart alerts with actionable recommendations
- **History management**: Program snapshots with version diffing
- **Offline capability**: IndexedDB cache with TTL and statistics
- **Test coverage**: Deterministic test harness with 11 validation scenarios

### Integration Layer (F13-F16)
- **React hooks**: useRtFForecast, useRtFTimeline, useRtFWeekGoals with ETag caching
- **Dashboard interface**: 6-tab comprehensive RTF analytics platform

## Design Notes
- Prefer server components for static RtF data (timeline / forecast) then hydrate where interaction needed.
- Hooks (F13-F15) will encapsulate caching + ETag conditional fetch logic.
- Visual differentiation: use ProgramStyleBadge coloring tokens.
- Offline strategy: IndexedDB keyed by version + routineId; invalidated when backend version increments.

## Changelog
Date | Change
-----|-------
2025-09-24 | Extracted roadmap into docs/roadmaps (initial)
2025-09-24 | **Major RTF milestone**: RTF-F04 ETag integration layer, RTF-F06 AMRAP performance panel, RTF-F16 Dashboard integration completed
2025-09-24 | **Final RTF milestone**: RTF-F08 Anomaly notifications, RTF-F09 Program history, RTF-F12 Test harness completed - **100% RTF roadmap achievement**
