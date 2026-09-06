# Sunnsteel Product Roadmap

Last verified against the frontend, backend, and shared contracts: **2026-09-06**.

This is the canonical product feature registry for Sunnsteel. It tells humans and
coding agents what the product already does, what is next, which ideas are only
candidates, and which foundations must exist before larger features are started.

This document is not a technical-debt log. Performance defects, cleanup, and
implementation hazards belong in [technical-debt.md](technical-debt.md). The code
remains the final source of truth when it disagrees with this file.

## How to use this document

Before proposing or implementing product work:

1. Read the current product snapshot and active queue.
2. Find the feature by its stable ID; do not create a duplicate entry.
3. Verify the relevant code before changing a status to `SHIPPED`.
4. Move an item to `IN_PROGRESS` when implementation actually starts.
5. When it ships, add the completion date and links to the relevant code, PR, or
   migration in the completion log.
6. If a feature changes API shapes, update and publish `@sunsteel/contracts`
   before consuming the new version in the frontend or backend.

### Statuses

| Status        | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `SHIPPED`     | Verified in the current code.                                     |
| `IN_PROGRESS` | Actively being implemented.                                       |
| `NEXT`        | Selected as the immediate product work.                           |
| `QUEUED`      | Approved direction with an established order.                     |
| `CANDIDATE`   | Worth retaining, but not committed to the queue.                  |
| `BLOCKED`     | Cannot proceed until a stated dependency or decision is resolved. |
| `DEFERRED`    | Intentionally postponed.                                          |
| `REJECTED`    | Evaluated and declined; retain the reason.                        |

Repository abbreviations: **FE** = `sunnsteel-frontend`, **BE** =
`sunnsteel-backend`, **CT** = `sunnsteel-contracts`.

## Current product snapshot

| ID      | Status    | Capability                                                                                                                                           | Evidence / notes                                              |
| ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| CORE-01 | `SHIPPED` | Email/password and Google authentication, protected routing, and recoverable session-marker cleanup                                                  | FE auth provider, auth controller, middleware, and auth tests |
| CORE-02 | `SHIPPED` | Installable PWA shell with production service worker, safe updates, generated icons, and development cleanup                                         | FE PWA provider, service-worker policy, and `public/sw.js`    |
| CORE-03 | `SHIPPED` | Responsive protected shell with collapsible navigation, global user search, profile menu, and light/dark themes                                      | FE protected layout and shell components                      |
| PROF-01 | `SHIPPED` | Editable name, age, sex, height, weight, and cropped avatar upload; the account carries a weight-unit preference but Settings does not yet expose it | FE settings; BE users module; CT user contracts               |
| PROF-02 | `SHIPPED` | Public profile lookup with follower/following counts                                                                                                 | FE profile; BE `GET /users/:id`                               |
| SOC-01  | `SHIPPED` | User search plus follow and unfollow relationships                                                                                                   | FE search/follow hooks; BE users service; `UserFollow` model  |
| ROUT-01 | `SHIPPED` | Routine creation, editing, deletion, favorites, and list filtering; a completion field exists but is not presented as meaningful program progress    | FE routine pages and wizard; BE routines module               |
| ROUT-02 | `SHIPPED` | Routine days, exercise ordering, fixed/ranged reps, target weight/RIR, rest time, notes, and per-exercise progression                                | CT routine contracts and BE routine schema                    |
| LIVE-00 | `SHIPPED` | Start/resume a session, log completed sets, save per-set state, finish/abort, and apply configured progression                                       | FE workout session; BE workout services                       |
| HIST-01 | `SHIPPED` | Paginated workout history with status, routine, date, text, and sort filters                                                                         | FE workout history; BE session listing                        |
| DASH-01 | `SHIPPED` | Today's scheduled workouts, weekly statistics, recent sessions, personal records, streaks, and lifetime volume                                       | FE dashboard; BE stats/progress endpoints                     |

## Immediate product-integrity work

These are current correctness or honesty gaps, not optional enhancements.

| ID     | Status | Work item                           | Expected behavior                                                                                                                           | Repositories                           |
| ------ | ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| FIX-01 | `NEXT` | Remove fabricated profile content   | Profiles must not claim that every user has the same biography or lives in San Francisco. Show real optional data or an honest empty state. | FE                                     |
| FIX-02 | `NEXT` | Remove the unconditional Pro badge  | Display a membership/title badge only when backed by a real account state.                                                                  | FE, optionally BE/CT                   |
| FIX-03 | `NEXT` | Correct kg/lb handling              | Store one canonical value and convert all inputs, outputs, records, plate calculations, and labels consistently.                            | FE, BE, CT                             |
| FIX-04 | `NEXT` | Repair Quick Workout                | Starting without a routine must open a session in which exercises and sets can actually be added and logged.                                | FE, BE, CT                             |
| FIX-05 | `NEXT` | Make Share Profile functional       | Share or copy a stable public profile URL with clear success/failure feedback.                                                              | FE; depends on PROF-03 for handle URLs |
| FIX-06 | `NEXT` | Make relationship counts functional | Followers and Following controls must open real lists rather than only looking clickable.                                                   | FE, BE, CT                             |
| FIX-07 | `NEXT` | Align search copy with behavior     | Do not claim username search until unique usernames exist; avoid presenting email as a public identity.                                     | FE                                     |
| FIX-08 | `NEXT` | Replace fixed dashboard goals       | Weekly and lifetime targets must come from user goals or be clearly labeled generic milestones.                                             | FE, BE, CT                             |

## Active queue

This records dependency order, not an estimate or a detailed implementation plan.

| Order | Queue group              | Included feature IDs                                 | Why it precedes later work                                                                            |
| ----- | ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1     | Product integrity        | FIX-01 through FIX-08                                | Existing screens and flows must be truthful and usable first.                                         |
| 2     | Daily session essentials | LIVE-01 through LIVE-06                              | High-frequency improvements mostly reuse data already collected.                                      |
| 3     | Analytics foundation     | DATA-01 through DATA-05                              | Progress, achievements, feeds, and notifications need durable records and events.                     |
| 4     | Visible workout payoff   | LIVE-07 through LIVE-10                              | Makes records and progression understandable during and after training.                               |
| 5     | Identity and privacy     | PROF-03 through PROF-10                              | Public identity and visibility rules are prerequisites for social expansion.                          |
| 6     | Progress destination     | PROG-01 through PROG-08                              | Activates the disabled Progress navigation on efficient data reads.                                   |
| 7     | Achievements and ranks   | ACH-01 through ACH-05                                | Uses the events layer and turns the visual theme into a product mechanic.                             |
| 8     | Social core              | SOC-02 through SOC-08                                | Builds safe discovery and activity before messaging.                                                  |
| 9     | Schedule and push        | SCHED-01 through SCHED-07, NOTIF-01 through NOTIF-05 | Improves retention and makes the installed PWA materially useful.                                     |
| 10    | Routine ecosystem        | ROUT-03 through ROUT-11                              | Sharing depends on truthful history, identity, and privacy.                                           |
| 11    | Complex infrastructure   | OFFLINE-01, MSG-01 through MSG-05                    | Offline conflict resolution, realtime delivery, moderation, and unread state are substantial systems. |

## Feature catalog

### Live workout experience

| ID      | Status      | Feature                        | User-facing behavior                                                                                                                                | Dependencies                                              |
| ------- | ----------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| LIVE-01 | `QUEUED`    | Rest timer                     | Completing a set starts the exercise's stored rest duration with add 15 seconds, skip, sound/vibration, and a deadline that survives backgrounding. | Existing `restSeconds`; NOTIF-02 for locked-screen alerts |
| LIVE-02 | `QUEUED`    | Screen wake lock               | Keep the display awake while an active session is in use, with graceful fallback where unsupported.                                                 | None                                                      |
| LIVE-03 | `QUEUED`    | Previous performance inline    | Show the matching set from the most recent comparable workout beneath the current input and highlight improvement.                                  | Efficient previous-session query                          |
| LIVE-04 | `QUEUED`    | RPE capture                    | Let users enter the RPE already represented by set logs and displayed in history.                                                                   | Existing set-log field                                    |
| LIVE-05 | `QUEUED`    | Plate calculator               | Convert a target weight into bar and plate loading using saved equipment preferences.                                                               | PREF-01                                                   |
| LIVE-06 | `QUEUED`    | Functional ad-hoc workout      | Add, remove, reorder, and configure exercises and sets during Quick Workout; optionally save the result as a routine.                               | FIX-04                                                    |
| LIVE-07 | `QUEUED`    | Live PR detection              | Celebrate weight, rep, volume, and estimated-1RM records when a completed set earns them.                                                           | DATA-01                                                   |
| LIVE-08 | `QUEUED`    | Progression transparency       | Explain which exercises advanced, the old/new prescription, and the rule that fired.                                                                | DATA-02                                                   |
| LIVE-09 | `QUEUED`    | Session recap                  | Show duration, volume, completed sets, records, progression changes, notes, and comparison with the previous session.                               | DATA-01, DATA-02                                          |
| LIVE-10 | `QUEUED`    | Abandoned-session recovery     | For a stale session, offer Resume, finish using saved work, or discard instead of silently cleaning it up.                                          | Existing `lastActivityAt` and maintenance behavior        |
| LIVE-11 | `CANDIDATE` | Exercise substitution          | Recommend alternatives by muscles and equipment and apply them to this session or optionally to the routine.                                        | EXER-05, DATA-04                                          |
| LIVE-12 | `CANDIDATE` | Set classifications            | Distinguish warm-up, working, drop, failure, and optional sets so only intended work affects progression and analytics.                             | BE/CT schema change                                       |
| LIVE-13 | `CANDIDATE` | Warm-up ramp generator         | Generate non-counting ramp sets from the working weight, bar, and available plates.                                                                 | LIVE-05, LIVE-12                                          |
| LIVE-14 | `CANDIDATE` | Supersets and circuits         | Group exercises, rotate through them by round, and apply rest at the correct point.                                                                 | ROUT-12, LIVE-01                                          |
| LIVE-15 | `CANDIDATE` | Faster set editing             | Duplicate a set, copy previous values, insert another set, or reorder session-only work.                                                            | LIVE-06                                                   |
| LIVE-16 | `CANDIDATE` | Session notes                  | Capture visible workout-level context and exercise-specific observations without overwriting routine instructions.                                  | CT/BE session note contracts                              |
| LIVE-17 | `CANDIDATE` | Post-workout correction window | Correct mistaken weight, reps, RPE, or completion status while preserving an audit trail.                                                           | DATA-02                                                   |
| LIVE-18 | `CANDIDATE` | Gym mode                       | Offer larger controls, stronger contrast, and fewer secondary actions during training.                                                              | A11Y-02                                                   |

### Analytics and historical-data foundation

| ID      | Status   | Feature                      | User-facing or architectural outcome                                                                                      | Dependencies                 |
| ------- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| DATA-01 | `QUEUED` | Persistent personal records  | Store record events when they occur instead of deriving all records from the user's lifetime set-log table on every read. | BE/CT migration and backfill |
| DATA-02 | `QUEUED` | Training-event stream        | Persist session completions, PRs, streak milestones, progression changes, and achievements as addressable events.         | BE/CT schema                 |
| DATA-03 | `QUEUED` | Daily and weekly rollups     | Store volume, completed sets, active days, and muscle-group totals for fast progress views.                               | BE schema and backfill       |
| DATA-04 | `QUEUED` | Routine snapshot per session | Preserve the routine/day/exercise prescription used at training time so future edits cannot rewrite history.              | BE/CT schema                 |
| DATA-05 | `QUEUED` | Historical backfill          | Generate initial records, events, rollups, and snapshots from existing sessions with repeatable migration logic.          | DATA-01 through DATA-04      |

### Progress

| ID      | Status      | Feature                         | User-facing behavior                                                                                                      | Dependencies            |
| ------- | ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| PROG-01 | `QUEUED`    | Exercise strength trends        | Plot best-set and estimated-1RM development for a selected lift and date range.                                           | DATA-01, DATA-03        |
| PROG-02 | `QUEUED`    | Exercise performance history    | Show every session containing an exercise with sets, RPE, notes, and progression.                                         | DATA-04                 |
| PROG-03 | `QUEUED`    | Muscle-group heatmap            | Weight primary muscles at 1.0 and secondary muscles at 0.5 to visualize weekly training distribution.                     | DATA-03                 |
| PROG-04 | `QUEUED`    | Volume trends                   | Compare useful volume by week, muscle, routine, and exercise without treating lifetime total as the main strength signal. | DATA-03                 |
| PROG-05 | `QUEUED`    | Consistency calendar            | Display completed, missed, aborted, scheduled, and recovery days.                                                         | DATA-02, SCHED-01       |
| PROG-06 | `QUEUED`    | Session comparison              | Compare the latest execution of a routine day against previous performances.                                              | DATA-04                 |
| PROG-07 | `QUEUED`    | Record and progression timeline | Show when records and prescription changes occurred and why.                                                              | DATA-01, DATA-02        |
| PROG-08 | `QUEUED`    | Personal goals                  | Track frequency, strength, volume, consistency, and optional body-measurement targets.                                    | PREF-02, DATA-03        |
| PROG-09 | `CANDIDATE` | Plateau detection               | Surface exercises with repeated comparable performances and no meaningful progress.                                       | PROG-01, LIVE-04        |
| PROG-10 | `CANDIDATE` | Fatigue indicators              | Combine RPE, missed targets, recent decline, and frequency to flag possible fatigue without diagnosing.                   | LIVE-04, DATA-03        |
| PROG-11 | `CANDIDATE` | Training-block comparison       | Compare performance and adherence between program phases.                                                                 | ROUT-09, DATA-03        |
| PROG-12 | `CANDIDATE` | Body measurements               | Track weight and optional measurements privately with trends and goal context.                                            | PROF-06, FIX-03         |
| PROG-13 | `CANDIDATE` | Progress photos                 | Store private dated photos and support side-by-side comparison with explicit sharing controls.                            | PROF-06, storage policy |
| PROG-14 | `CANDIDATE` | Exportable progress report      | Produce a selected, shareable summary for personal review or a coach.                                                     | EXPORT-01               |

Use lightweight CSS or hand-rolled SVG for initial progress visuals. Do not
restore a large charting dependency without measuring the installed PWA's
cold-start impact and showing that simpler rendering is insufficient.

### Exercise library

| ID      | Status      | Feature                        | User-facing behavior                                                                                     | Dependencies                   |
| ------- | ----------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| EXER-01 | `CANDIDATE` | Personal exercise page         | Show routines using the exercise, recent performances, best set, estimated 1RM, and progression history. | PROG-01, PROG-02               |
| EXER-02 | `CANDIDATE` | Catalog browsing               | Filter exercises by muscle, equipment, movement pattern, favorites, and training history.                | Expanded exercise metadata     |
| EXER-03 | `CANDIDATE` | Instructions and cues          | Provide setup, execution, common mistakes, and appropriate safety notes.                                 | Content-authoring process      |
| EXER-04 | `CANDIDATE` | Muscle visualization and media | Display targeted muscles and concise demonstrations where reliable assets exist.                         | Curated assets and licenses    |
| EXER-05 | `CANDIDATE` | Alternatives                   | Suggest substitutions based on movement, primary muscles, and available equipment.                       | Expanded exercise metadata     |
| EXER-06 | `CANDIDATE` | Custom exercises               | Let users create private catalog entries with muscles, equipment, and notes.                             | BE/CT ownership model          |
| EXER-07 | `CANDIDATE` | Favorites and recents          | Prioritize commonly used exercises in the routine wizard and Quick Workout.                              | User-exercise preference model |
| EXER-08 | `CANDIDATE` | Catalog moderation             | Review duplicates, naming, instructions, and promoted user submissions.                                  | Administrative tooling         |

The first Exercises release should emphasize the user's existing training data.
Instructions and media make this a content project as well as an engineering one.

### Routines and programming

| ID      | Status      | Feature                        | User-facing behavior                                                                                          | Dependencies          |
| ------- | ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------- |
| ROUT-03 | `QUEUED`    | Starter templates              | Open curated programs in the existing wizard as fully editable drafts.                                        | Curated templates     |
| ROUT-04 | `QUEUED`    | Routine sharing                | Publish, share with followers, or expose through a private link under explicit visibility controls.           | PROF-06               |
| ROUT-05 | `QUEUED`    | Routine cloning                | Copy a shared routine into an independent editable version.                                                   | ROUT-04               |
| ROUT-06 | `QUEUED`    | Routine lineage                | Preserve original authorship and identify the source of a clone.                                              | ROUT-05, PROF-03      |
| ROUT-07 | `QUEUED`    | Routine discovery              | Browse programs by goal, days, experience, equipment, duration, and muscle focus.                             | ROUT-04, EXER-02      |
| ROUT-08 | `QUEUED`    | Routine versions               | Create intentional versions, compare them, and restore an earlier setup.                                      | DATA-04               |
| ROUT-09 | `QUEUED`    | Training blocks and deloads    | Organize dated program phases and apply temporary deload prescriptions without destroying the normal routine. | ROUT-08, SCHED-01     |
| ROUT-10 | `QUEUED`    | Quality summary                | Before saving, show weekly muscle-group sets, equipment, estimated duration, and likely imbalances.           | EXER metadata         |
| ROUT-11 | `QUEUED`    | Flexible day identity          | Support named and unscheduled rotation days instead of requiring every day to be only a weekday.              | BE/CT routine model   |
| ROUT-12 | `CANDIDATE` | Superset/circuit configuration | Group routine exercises and define order within a round.                                                      | BE/CT schema; LIVE-14 |
| ROUT-13 | `CANDIDATE` | Routine import/export          | Back up and exchange programs through a stable versioned format.                                              | EXPORT-01             |
| ROUT-14 | `DEFERRED`  | Collaborative editing          | Allow an invited coach or collaborator to suggest or make changes with an audit trail.                        | COACH-01, DATA-02     |

### Schedule

| ID       | Status      | Feature                      | User-facing behavior                                                                   | Dependencies            |
| -------- | ----------- | ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| SCHED-01 | `QUEUED`    | Weekly calendar              | Combine planned routine days, completed workouts, skipped sessions, and recovery days. | ROUT-11                 |
| SCHED-02 | `QUEUED`    | Monthly calendar             | Provide a higher-level history and consistency view.                                   | SCHED-01, DATA-02       |
| SCHED-03 | `QUEUED`    | Start from calendar          | Launch or resume the workout represented by a schedule entry.                          | SCHED-01                |
| SCHED-04 | `QUEUED`    | Reschedule one occurrence    | Move a workout without rewriting the entire routine.                                   | Schedule-instance model |
| SCHED-05 | `QUEUED`    | Skip and postpone            | Distinguish intentional schedule changes from missed training.                         | SCHED-04                |
| SCHED-06 | `QUEUED`    | Recurring and rotating plans | Support weekday schedules and non-weekly rotations.                                    | ROUT-11                 |
| SCHED-07 | `QUEUED`    | Rest-day planning            | Represent intentional recovery as part of the program rather than as inactivity.       | SCHED-01                |
| SCHED-08 | `CANDIDATE` | Travel or alternate gym      | Temporarily change available equipment and substitutions for a date range.             | PREF-01, EXER-05        |
| SCHED-09 | `CANDIDATE` | External calendar export     | Optionally expose scheduled workouts to common calendar applications.                  | Stable schedule model   |

### Profiles, identity, and privacy

| ID      | Status      | Feature                           | User-facing behavior                                                                                                                                                             | Dependencies                             |
| ------- | ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| PROF-03 | `QUEUED`    | Unique username                   | Provide a stable handle for readable URLs, mentions, and search.                                                                                                                 | BE/CT uniqueness and reserved-name rules |
| PROF-04 | `QUEUED`    | Real biography and location       | Add optional editable fields with honest empty states and individual visibility.                                                                                                 | PROF-06                                  |
| PROF-05 | `QUEUED`    | Training identity                 | Add optional goals, experience, disciplines, preferred style, and favorite exercises.                                                                                            | PROF-06                                  |
| PROF-06 | `QUEUED`    | Privacy model                     | Define `public`, `followers`, and `private` visibility for history, records, routines, achievements, and body metrics; email, age, sex, and body data remain private by default. | BE/CT authorization rules                |
| PROF-07 | `QUEUED`    | Featured records and achievements | Let users deliberately select which public accomplishments appear prominently.                                                                                                   | DATA-01, ACH-01, PROF-06                 |
| PROF-08 | `QUEUED`    | Routine showcase                  | Display selected public routines on a profile.                                                                                                                                   | ROUT-04, PROF-06                         |
| PROF-09 | `QUEUED`    | Account discovery controls        | Control whether a profile can be found by name, handle, or future contact matching.                                                                                              | PROF-03, PROF-06                         |
| PROF-10 | `QUEUED`    | Block and report                  | Give users immediate control over unwanted discovery and interaction.                                                                                                            | BE/CT moderation model                   |
| PROF-11 | `CANDIDATE` | Branded profile card              | Generate a shareable image containing selected public identity, rank, and accomplishments.                                                                                       | PROF-03, PROF-07                         |

### Social and community

| ID     | Status      | Feature                    | User-facing behavior                                                                                              | Dependencies                      |
| ------ | ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| SOC-02 | `QUEUED`    | Relationship lists         | Browse followers, following, mutuals, and relevant suggestions.                                                   | FIX-06                            |
| SOC-03 | `QUEUED`    | Generated activity feed    | Automatically create optional entries for completed sessions, PRs, achievements, routines, and streak milestones. | DATA-02, PROF-06                  |
| SOC-04 | `QUEUED`    | Selective activity sharing | Configure sharing defaults by event type and override visibility for one entry.                                   | SOC-03, PROF-06                   |
| SOC-05 | `QUEUED`    | Themed reactions           | Encourage activity with a small Sunnsteel-specific reaction set rather than a generic like counter.               | SOC-03, PROF-10                   |
| SOC-06 | `QUEUED`    | Comments                   | Discuss shared activity with deletion, reporting, and visibility enforcement.                                     | SOC-03, PROF-10, moderation tools |
| SOC-07 | `QUEUED`    | Structured workout sharing | Share a session recap that preserves selected statistics and links to permitted details.                          | LIVE-09, PROF-06                  |
| SOC-08 | `QUEUED`    | Training partners          | Establish a mutual relationship with explicit shared schedule and progress permissions.                           | PROF-06, SOC-02                   |
| SOC-09 | `CANDIDATE` | Partner encouragement      | Send lightweight prompts such as Ready to train or Strong session without opening full messaging.                 | SOC-08, NOTIF-01                  |
| SOC-10 | `CANDIDATE` | Private challenges         | Invite friends to frequency, consistency, or relative-improvement goals.                                          | DATA-02, PROF-06                  |
| SOC-11 | `CANDIDATE` | Public challenges          | Join inclusive community campaigns scored by consistency or relative progress.                                    | SOC-10, moderation                |
| SOC-12 | `DEFERRED`  | Training groups            | Create clubs with a shared feed, routines, challenges, roles, and moderation.                                     | SOC-03, SOC-10, PROF-10           |

### Achievements and motivation

| ID     | Status      | Feature                | User-facing behavior                                                                                         | Dependencies      |
| ------ | ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| ACH-01 | `QUEUED`    | Milestone achievements | Award verified milestones for sessions, sets, volume, records, and streaks.                                  | DATA-01, DATA-02  |
| ACH-02 | `QUEUED`    | Renaissance ranks      | Progress from Initiate through themed ranks using consistency and participation rather than absolute weight. | ACH-01            |
| ACH-03 | `QUEUED`    | Achievement showcase   | Select medals and titles for the public profile.                                                             | PROF-06, PROF-07  |
| ACH-04 | `QUEUED`    | Achievement progress   | Show understandable progress toward the next milestone without encouraging unsafe behavior.                  | ACH-01            |
| ACH-05 | `QUEUED`    | Comeback recognition   | Recognize renewed consistency after a break rather than only rewarding uninterrupted streaks.                | DATA-02           |
| ACH-06 | `CANDIDATE` | Personal quests        | Offer short private targets based on the user's real schedule and current ability.                           | PROG-08, SCHED-01 |
| ACH-07 | `CANDIDATE` | Seasonal campaigns     | Run optional themed challenges without resetting permanent progress.                                         | SOC-11            |

### Dashboard and post-login experience

| ID         | Status      | Feature                   | User-facing behavior                                                                                           | Dependencies                  |
| ---------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| DASH-02    | `CANDIDATE` | Adaptive primary action   | Make Start, Resume, or Review the dominant action according to the user's current state.                       | Existing active/today queries |
| DASH-03    | `CANDIDATE` | Weekly training strip     | Summarize the current week and open the relevant workout or schedule entry.                                    | SCHED-01                      |
| DASH-04    | `CANDIDATE` | Goal-based dashboard      | Emphasize statistics related to the user's selected objective.                                                 | PROG-08                       |
| DASH-05    | `CANDIDATE` | Configurable cards        | Let users reorder or hide schedule, records, streak, activity, and progress modules.                           | PREF-03                       |
| DASH-06    | `CANDIDATE` | Stronger visual hierarchy | Replace repetitive cards with compact progress visuals, milestone callouts, and clearer mobile prioritization. | Progress data                 |
| DASH-07    | `CANDIDATE` | Personalized insights     | Surface concise facts such as recent consistency changes or a lift approaching a record.                       | DATA-01, DATA-03              |
| DASH-08    | `CANDIDATE` | Social preview            | Show a small set of relevant followed-user updates without displacing training actions.                        | SOC-03                        |
| DASH-09    | `CANDIDATE` | Upcoming milestones       | Preview the next rank, record, streak, or session milestone.                                                   | ACH-01                        |
| DASH-10    | `CANDIDATE` | Contextual empty states   | Turn every empty module into the most useful next action.                                                      | None                          |
| ONBOARD-01 | `CANDIDATE` | First-login onboarding    | Gather goals, experience, training days, equipment, and units, then recommend a template or first action.      | ROUT-03, PREF-01, PROG-08     |

### Search and navigation

| ID     | Status      | Feature                   | User-facing behavior                                                                       | Dependencies              |
| ------ | ----------- | ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- |
| NAV-01 | `CANDIDATE` | Unified search            | Search users, exercises, routines, and workout history from the header.                    | EXER-02, ROUT-07, PROF-03 |
| NAV-02 | `CANDIDATE` | Grouped suggestions       | Show categorized instant results before opening the full results page.                     | NAV-01                    |
| NAV-03 | `CANDIDATE` | Recent searches           | Reopen recently viewed users, exercises, and routines.                                     | NAV-01                    |
| NAV-04 | `CANDIDATE` | Mobile quick actions      | Start or resume a workout, create a routine, or open the timer from a compact menu.        | LIVE-01                   |
| NAV-05 | `CANDIDATE` | Navigation badges         | Display restrained unread or upcoming indicators for notifications and schedule.           | NOTIF-01, SCHED-01        |
| NAV-06 | `CANDIDATE` | Persistent history access | Keep workout history directly reachable even when Workouts redirects to an active session. | None                      |

### Notifications and retention

| ID       | Status      | Feature                    | User-facing behavior                                                                            | Dependencies                                        |
| -------- | ----------- | -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| NOTIF-01 | `QUEUED`    | In-app notification center | Collect actionable training, schedule, achievement, and social notifications with read state.   | DATA-02, PROF-06                                    |
| NOTIF-02 | `QUEUED`    | Web Push foundation        | Deliver explicitly authorized notifications to supported installed PWAs.                        | Push subscriptions, BE delivery service, SW changes |
| NOTIF-03 | `QUEUED`    | Rest-timer alert           | Notify when rest ends while the app is backgrounded or the screen is locked.                    | LIVE-01, NOTIF-02                                   |
| NOTIF-04 | `QUEUED`    | Training reminders         | Remind users before scheduled sessions using their time zone and quiet hours.                   | SCHED-01, PREF-04, NOTIF-02                         |
| NOTIF-05 | `QUEUED`    | Notification controls      | Configure categories, channels, quiet hours, and optional digests.                              | NOTIF-01, NOTIF-02                                  |
| NOTIF-06 | `CANDIDATE` | Streak-at-risk reminder    | Offer an optional nudge based on the real training schedule rather than generic daily pressure. | SCHED-01, DATA-02                                   |
| NOTIF-07 | `CANDIDATE` | Partner activity alerts    | Notify only for selected partner events and respect both users' privacy preferences.            | SOC-08, NOTIF-05                                    |

### Preferences, accessibility, and trust

| ID        | Status      | Feature                               | User-facing behavior                                                               | Dependencies            |
| --------- | ----------- | ------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| PREF-01   | `CANDIDATE` | Equipment and plate preferences       | Store bar weight, available plates, and equipment by training location.            | FIX-03                  |
| PREF-02   | `CANDIDATE` | Training-goal preferences             | Store personal targets used by Progress and the dashboard.                         | PROG-08                 |
| PREF-03   | `CANDIDATE` | Dashboard preferences                 | Persist card order and visibility.                                                 | DASH-05                 |
| PREF-04   | `CANDIDATE` | Locale and time preferences           | Configure time zone, week start, language, and formatting.                         | BE/CT preferences model |
| A11Y-01   | `CANDIDATE` | Reduced motion                        | Respect system and account preferences across splash and page transitions.         | None                    |
| A11Y-02   | `CANDIDATE` | High contrast and larger controls     | Improve bright-gym readability and one-handed training use.                        | None                    |
| A11Y-03   | `CANDIDATE` | Keyboard and screen-reader completion | Make routine building and set logging fully understandable and operable.           | Accessibility audit     |
| EXPORT-01 | `CANDIDATE` | User data export                      | Download routines, sessions, records, and optional measurements in stable formats. | Data inventory          |
| TRUST-01  | `CANDIDATE` | Account deletion                      | Clearly explain and complete removal of user data and stored media.                | BE deletion workflow    |
| TRUST-02  | `CANDIDATE` | Privacy dashboard                     | Show what information is public and where it appears.                              | PROF-06                 |
| TRUST-03  | `CANDIDATE` | Connection and sync state             | Clearly distinguish offline, pending, saving, synchronized, and failed data.       | OFFLINE-01              |

### Deferred infrastructure-heavy features

| ID         | Status     | Feature                   | User-facing behavior                                                                                      | Why deferred / dependencies                                                         |
| ---------- | ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| OFFLINE-01 | `DEFERRED` | Offline workout logging   | Keep active sessions writable without connectivity and synchronize later with explicit conflict handling. | Requires durable local queue, idempotent mutations, reconciliation, and recovery UI |
| MSG-01     | `DEFERRED` | Direct messages           | Support text plus embedded workouts, routines, exercises, and challenges.                                 | Realtime/polling strategy, moderation, notifications, retention policy              |
| MSG-02     | `DEFERRED` | Message requests          | Keep unsolicited messages outside the main inbox and enforce blocks.                                      | MSG-01, PROF-10                                                                     |
| MSG-03     | `DEFERRED` | Unread and delivery state | Track unread counts and reliable delivery without implying end-to-end encryption.                         | MSG-01, NOTIF-01                                                                    |
| MSG-04     | `DEFERRED` | Group discussion          | Add moderated conversation to training groups.                                                            | MSG-01, SOC-12                                                                      |
| MSG-05     | `DEFERRED` | Media attachments         | Share approved images or media with storage quotas and abuse controls.                                    | MSG-01, storage/moderation policy                                                   |
| COACH-01   | `DEFERRED` | Coach-athlete mode        | Grant a coach explicit access to routines, selected progress, completed sessions, and notes.              | PROF-06, ROUT-14, audit events                                                      |
| COACH-02   | `DEFERRED` | Coach marketplace         | Allow verified coaches to publish services or programs.                                                   | COACH-01, identity verification, payments, disputes                                 |
| GROUP-01   | `DEFERRED` | Clubs and teams           | Shared feed, routine library, challenges, roles, and moderation.                                          | SOC-12, MSG-04                                                                      |

### Longer-term intelligent and integration candidates

| ID       | Status      | Feature                          | User-facing behavior                                                                              | Dependencies                         |
| -------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| INTEL-01 | `CANDIDATE` | Adaptive progression suggestions | Recommend changes using comparable performance and RPE while requiring user confirmation.         | LIVE-04, DATA-01, DATA-04            |
| INTEL-02 | `CANDIDATE` | Deload suggestions               | Propose a lighter period from sustained fatigue signals without making medical claims.            | PROG-10, ROUT-09                     |
| INTEL-03 | `CANDIDATE` | Natural-language routine draft   | Turn goals and constraints into an editable wizard draft, never directly publish a hidden plan.   | ROUT-03, EXER metadata               |
| INTEL-04 | `CANDIDATE` | Workout review assistant         | Explain patterns using the user's selected training data and cite the sessions behind each claim. | DATA-01 through DATA-04              |
| INTEG-01 | `CANDIDATE` | Wearable integration             | Import useful workout duration, heart-rate, or recovery signals with explicit provenance.         | Provider selection and consent model |
| INTEG-02 | `CANDIDATE` | Health-platform integration      | Optionally synchronize workouts and measurements with Apple Health or Health Connect.             | Mobile/PWA feasibility study         |
| INTEG-03 | `CANDIDATE` | External calendar integration    | Synchronize scheduled sessions after the internal schedule model is stable.                       | SCHED-09                             |

## Product rules and retained decisions

- Privacy is designed before activity feeds, public routines, comments, coaching,
  or messaging. Sensitive profile and body data is private by default.
- Progress, achievements, feeds, and notifications build on persistent records,
  events, rollups, and truthful historical snapshots—not repeated lifetime scans.
- Estimated 1RM per lift is the headline strength trend. Total volume is useful
  mainly in exercise and muscle-group context.
- Ranks and leaderboards favor consistency and relative improvement rather than
  absolute load so they remain meaningful across body sizes and experience.
- The active-session screen prioritizes speed, legibility, offline resilience,
  and one-handed use over decorative complexity.
- Social activity is generated from training events with explicit sharing
  controls; users are not required to author conventional social posts.
- Messaging is not an early social feature. It remains deferred until identity,
  privacy, blocking, moderation, notifications, and delivery infrastructure exist.
- Exercise instructions and demonstrations require a maintained content and
  licensing process; engineering alone is not sufficient.
- Automated training recommendations explain their evidence and require user
  confirmation. They do not diagnose injuries, recovery state, or health issues.

## Rejected features

No product feature has been formally rejected yet. When one is rejected, retain
its stable ID here with the date and reason so a future session does not propose
it again without addressing the original decision.

## Completion log

| Date       | Feature IDs                                                                                                  | Evidence                                      | Notes                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------- |
| 2026-09-06 | CORE-01 through CORE-03, PROF-01 through PROF-02, SOC-01, ROUT-01 through ROUT-02, LIVE-00, HIST-01, DASH-01 | Verified against the three local repositories | Initial product snapshot and roadmap created. |

## Document history

- **2026-09-06:** Created the canonical product registry from a review of the
  frontend, backend, shared contracts, existing technical-debt roadmap, and the
  combined feature brainstorm.
