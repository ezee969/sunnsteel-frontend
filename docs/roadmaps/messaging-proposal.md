# Direct messages -- decomposition proposal

**Status: proposed, not approved (2026-10-04).** Nothing here is claimed or
built. When the owner approves it, the rows below replace `MSG-01` to `MSG-06`
in the roadmap catalog with the decisions recorded, and this file becomes
historical. Program item 5 asked for this decomposition and the list of
decisions, and for no building until it is approved.

## What exists to build on

- **Who a member is to another**: follows (`SOC-01`), training partners
  (`SOC-08`), blocks that are mutual and enforced before every read
  (`PROF-10`), moderation hides and an append-only enforcement record
  (`TRUST-04`).
- **Objects already shareable under rules**: routines through `ROUT-04`
  visibility and links and `ROUT-05` cloning; activity entries through
  `SOC-03`/`SOC-04` audiences; session share links (`SOC-07`). Each is
  resolved at read time by the server, and a conversation must reuse those
  rules rather than copy data.
- **Delivery**: the in-app notification centre (`NOTIF-01`, paged since
  `NOTIF-09`) with per-category controls and quiet hours (`NOTIF-05`), and Web
  Push (`NOTIF-02`/`NOTIF-03`). Nothing is realtime today: the bell refreshes
  on focus and every five minutes.
- **Account rules**: deletion is immediate and complete (`TRUST-01`); the
  export carries everything the member owns (`EXPORT-01`).
- **Infrastructure**: one NestJS service on Railway with Railway Postgres;
  the frontend on Vercel; Supabase only for authentication. There is no
  socket server, queue or cache.

## Proposed items

Each item is deliverable on its own once the ones it depends on exist. Sizes
use the roadmap's scale.

| ID | Size | Feature | What ships | Depends on |
| --- | --- | --- | --- | --- |
| **MSG-06** | L | Realtime delivery foundation | One authenticated server-to-browser channel per signed-in member, reconnection with catch-up from a cursor, and the operational pieces (connection limits, health, fallbacks). **First consumer: the notification bell**, which goes live instead of polling every five minutes, so the transport is proven on a shipped feature before any message exists. No presence. | `NOTIF-09` |
| **MSG-01** | L | Conversations and text | One-to-one conversations of text: start one with a member the rules allow, send, list newest first with keyset paging, delete your own message. Who may message whom (decision 1), blocks ending a conversation for both, the per-member setting, rate limits, retention and account deletion (decisions 6-8), the export of your own messages. Live through `MSG-06`. | `MSG-06`, `PROF-10` |
| **MSG-02** | M | Message requests | A first message from someone the recipient's setting does not admit directly lands in Requests, not the inbox: accept, decline (the sender is not told), or block and report. Nothing about a request reaches push. | `MSG-01` |
| **MSG-03** | M | Unread state | Per-conversation read position for the reader only, the unread count in the sidebar, bottom bar and bell, and "new since you last looked" in a conversation. Read receipts are decision 5. | `MSG-01` |
| **MSG-08** | M | Message notifications | A Messages notification category with the `NOTIF-05` controls and quiet hours; push says who wrote, never what (decision 9); requests never push. | `MSG-01`, `NOTIF-05` |
| **MSG-09** | M | Reporting and moderation of messages | Report a message (`ReportSubjectKind` gains `MESSAGE`); the `TRUST-04` queue shows what decision 10 allows and logs every view; a moderator can hide a message for the reported member's counterpart and restrict an account's messaging. No browsing of conversations. | `MSG-01`, `TRUST-04` |
| **MSG-07** | M | Share a routine in a conversation | **The successor to the rejected `ROUT-13`.** Send one of your routines into a conversation as a card the recipient can open and clone (`ROUT-05`); what sending grants is decision 11; deleting the message withdraws it. | `MSG-01`, `ROUT-04`, `ROUT-05` |
| **MSG-10** | L | Share training objects | Workouts, personal records, achievements and progress summaries as cards, each resolved at read time under the sender's privacy and the reader's access, never copied into the message. One object kind at a time can ship. | `MSG-07` |
| **MSG-05** | L | Media attachments | Unchanged and still deferred: images with storage quotas, type and size limits, and abuse controls; needs a storage policy decision of its own. | `MSG-01`, `TRUST-04`, storage policy |
| MSG-04 | -- | Group discussion | Unchanged: superseded by `COMM-03`. Decision 4 settles the open question its row records (a group thread with no community behind it). | -- |

**Proposed order:** `MSG-06` (proven on the bell) -> `MSG-01` -> `MSG-02`
and `MSG-03` (either order) -> `MSG-08` -> `MSG-09` -> `MSG-07` -> `MSG-10`;
`MSG-05` stays deferred. `MSG-09` must ship before messaging is opened beyond
people who follow each other (decision 1), because reporting is the safety
control for strangers.

## Decisions for the owner

Each has a recommendation; the alternatives are the realistic ones.

1. **Who may message whom.** *Recommended:* a per-member setting -- Everyone
   (as requests), People I follow, or Nobody -- defaulting to **People I
   follow**: a member you follow reaches your inbox, anyone else (when you
   allow Everyone) reaches Requests, and a block always wins. *Alternatives:*
   mutual follows only; training partners only.
2. **The transport (`MSG-06`).** *Recommended:* **Server-Sent Events from the
   NestJS service, fanned out across instances with Postgres
   `LISTEN`/`NOTIFY`** -- no new vendor, the existing token verification, works
   behind Railway's proxy, one-way push with sends over ordinary HTTP.
   *Alternatives:* Supabase Realtime broadcast (managed, presence included, but
   messages live in Railway Postgres, so every event crosses two systems and a
   second authorization path); WebSockets on the NestJS service (two-way, but
   sticky connections and a fan-out layer anyway).
3. **Order.** *Recommended:* ship `MSG-06` first on the notification bell.
   *Alternative:* ship `MSG-01` on polling and add live delivery after.
4. **Groups without a community.** *Recommended:* **one-to-one only**; a small
   private group is a candidate for later, recorded on `MSG-04`'s row.
   *Alternative:* small groups (up to 8) inside `MSG-01`.
5. **Read receipts.** *Recommended:* **none** -- unread state is the reader's
   own. *Alternatives:* opt-in per member, shown only when both opt in; always
   on.
6. **Editing and deleting.** *Recommended:* no editing; **delete your own
   message for both** at any time, leaving "Message deleted". *Alternative:*
   edit within 15 minutes with an "edited" mark.
7. **Retention.** *Recommended:* messages are kept until a participant deletes
   them; a conversation both have deleted is removed. *Alternative:* expire
   after a fixed period (for example a year).
8. **Account deletion.** *Recommended:* consistent with `TRUST-01`, a deleted
   member's messages are **removed from both sides**, and the counterpart sees
   "Deleted member" on an empty conversation. *Alternative:* keep their
   messages for the counterpart under "Deleted member".
9. **Push content.** *Recommended:* push names the sender only ("Ana sent you a
   message"); the text stays in the app. *Alternative:* a short preview,
   switchable.
10. **What a moderator may read.** *Recommended:* the **reported message and up
    to the five messages before it** in that conversation, captured when the
    report is made, every view logged; nothing else. *Alternatives:* the
    reported message alone; the whole conversation on a report.
11. **What sending a routine grants (`MSG-07`).** *Recommended:* sending is the
    sender's consent, like a `ROUT-04` link: the recipient can open and clone
    that routine whatever its visibility, until the message is deleted.
    *Alternative:* the card resolves only under the routine's own visibility
    rule (a private routine reads as unavailable).
12. **Limits.** *Recommended:* 2,000 characters a message; 30 messages a minute
    per sender; 20 new conversations or requests a day; no link previews
    (links are plain text). *Alternative:* the owner's own numbers.
13. **Encryption, stated plainly.** *Recommended:* messages are stored on the
    server and are **not end-to-end encrypted**; Settings and the first
    conversation say so. No alternative is proposed: end-to-end encryption
    would rule out reporting and moderation as designed here.
