# Bookmark App - Development Changelog

## Project Overview

**App**: Bookmark - Next-Gen Productivity App  
**Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma (SQLite), React Query, Zustand  
**Location**: `c:\Users\patpr\OneDrive - TIAA\Work\Project\Go-Home`  
**Port**: 3001  
**Version**: 0.1.0

---

## Key Architecture Insights

- The app does **NOT** use the shared `Navigation` component — every page has its own hardcoded inline top bar. All nav changes must be made in each page individually.
- Nav order across pages: **Bookmarks → Tasks → Diary → Notes → Reminders**
- Pages use `@tanstack/react-query` for data fetching, `apiFetch` wrapper for API calls, and Prisma for database.
- Windows + OneDrive path can cause `.next` cache corruption — fix by deleting `.next` folder.

---

## Change Log

### 1. Adding Reminders to Navigation Menu

**Problem**: User couldn't see Reminders in the menu.

**What was done**:
- Initially edited `components/navigation.tsx` but discovered each page has its own inline top bar with hardcoded nav links — the shared Navigation component is not used.
- Added Reminders link with `BellIcon` to all 4 pages' inline nav bars (bookmarks, calendar, tasks, notes).
- Created `/app/reminders/page.tsx` as a dedicated reminders page.

**Files modified**:
- `app/bookmarks/page.tsx`
- `app/calendar/page.tsx`
- `app/tasks/page.tsx`
- `app/notes/page.tsx`
- `app/reminders/page.tsx` (new)

---

### 2. Fixing Duplicate Reminders in Menu

**Problem**: The bookmarks page had both the new Reminders nav link AND the old `ReminderBell` dropdown component.

**What was done**:
- Removed `ReminderBell` import and usage from all 4 pages.

**Files modified**:
- `app/bookmarks/page.tsx`
- `app/calendar/page.tsx`
- `app/tasks/page.tsx`
- `app/notes/page.tsx`

---

### 3. Fixing Tasks Page Nav Order

**Problem**: The task count badge (`openCount`) and a stray `}` appeared after the Reminders link instead of after Tasks.

**What was done**:
- Moved the badge right after the Tasks link and removed the extra brace.

**Files modified**:
- `app/tasks/page.tsx`

---

### 4. Adding Reminder Count Badge

**Problem**: No visual indicator of active reminders in the nav bar.

**What was done**:
- Added active (non-dismissed) reminder count as a red badge next to "Reminders" in the nav bar on all pages.
- Bookmarks/calendar/notes use a lightweight `useQuery` with `reminderCount` key.
- Tasks page uses `useReminders` hook's `active` array.

**Files modified**:
- `app/bookmarks/page.tsx`
- `app/calendar/page.tsx`
- `app/tasks/page.tsx`
- `app/notes/page.tsx`

---

### 5. Showing Tasks with Due Dates in Reminders Page

**Problem**: Reminders page only showed reminders, not tasks with due dates.

**What was done**:
- Enhanced the reminders page to fetch tasks and display incomplete tasks with due dates alongside reminders.
- Organized into sections: **Overdue**, **Due Today**, **Upcoming**, and **Dismissed**.
- Task cards show priority badges and allow completion toggle.

**Files modified**:
- `app/reminders/page.tsx`

---

### 6. Making Tasks Clickable in Reminders

**Problem**: Tasks shown in reminders page weren't clickable/navigable.

**What was done**:
- Added `?task=<id>` URL param support to the tasks page using `useSearchParams` — auto-opens the edit modal for the specified task.
- Made `TaskCard` in reminders page use `Link` to `/tasks?task=<id>`.

**Files modified**:
- `app/tasks/page.tsx`
- `app/reminders/page.tsx`

---

### 7. Adding Tasks and Notes Menu Links to Reminders Page

**Problem**: The reminders page was missing Tasks and Notes nav links.

**What was done**:
- Added them to match the order: Bookmarks → Tasks → Diary → Notes → Reminders.

**Files modified**:
- `app/reminders/page.tsx`

---

### 8. App Version Badge

**Problem**: No visible app version indicator.

**What was done**:
- Read version from `package.json`, exposed as `NEXT_PUBLIC_APP_VERSION` env var in `next.config.js`.
- Created `components/version-badge.tsx` as a fixed bottom-right subtle badge.
- Added to root layout.

**Files modified**:
- `next.config.js`
- `components/version-badge.tsx` (new)
- `app/layout.tsx`

---

### 9. Build Cache Error Fix

**Problem**: `EINVAL: invalid argument, readlink` error on Windows/OneDrive.

**What was done**:
- Deleted corrupted `.next` folder to fix the build cache error.

---

### 10. Showing Today's Notes in Reminders Page

**Problem**: Reminders page didn't show today's notes.

**What was done**:
- Added notes query to reminders page, displaying today's notes in a "📝 Today's Notes" section.
- Each note card links to `/notes?note=<id>`.
- Added `useSearchParams` support to the notes page to auto-open a note's edit modal from URL params.
- `NoteCard` component shows title, content preview (HTML stripped, truncated to 120 chars), category badge, and "Note" type badge.

**Files modified**:
- `app/notes/page.tsx`
- `app/reminders/page.tsx`

---

## File Reference

| File | Purpose |
|------|---------|
| `components/navigation.tsx` | Shared nav (unused by pages) |
| `app/bookmarks/page.tsx` | Bookmarks page with inline nav |
| `app/calendar/page.tsx` | Calendar/Diary page with inline nav |
| `app/tasks/page.tsx` | Tasks page with `?task=<id>` deep link support |
| `app/notes/page.tsx` | Notes page with `?note=<id>` deep link support |
| `app/reminders/page.tsx` | Reminders hub: reminders, tasks, today's notes |
| `lib/use-reminders.ts` | Hook: reminders CRUD, polling, browser notifications |
| `app/api/reminders/route.ts` | Reminders REST API |
| `next.config.js` | Exposes `NEXT_PUBLIC_APP_VERSION` |
| `components/version-badge.tsx` | Fixed bottom-right version badge |
| `app/layout.tsx` | Root layout with `VersionBadge` |
| `prisma/schema.prisma` | DB schema: Task, Note, Reminder models |

---

## Database Models (Key Fields)

**Task**: `id, userId, title, description, completed, priority, dueDate(String?), tags, subtasks, date, order, createdAt, updatedAt`

**Note**: `id, userId, title, content, tags, pinned, date(String?), category, createdAt, updatedAt`

**Reminder**: `id, userId, remindAt, dismissed, repeat, createdAt, updatedAt` *(see schema line 165)*

---

### 11. In-App Alarm with Sound & Snooze

**Problem**: No audible/visual alarm when reminders or tasks are due.

**What was done**:
- Created `components/alarm-modal.tsx` — a global alarm overlay that triggers when reminders are due or tasks are overdue.
- Uses Web Audio API to play a 3-beep alarm sound pattern, repeating every 5 seconds.
- Shows a full-screen modal with red header, listing all due items.
- Each item has **Dismiss** and **Snooze** (5m/10m/15m) buttons.
- Snooze on reminders updates `remindAt` to future time; snooze on tasks hides them from alarm for the session.
- Mute/unmute toggle to silence the alarm sound.
- Dismiss All button in the header.
- Added `AlarmModal` to root `app/layout.tsx` so it works on every page.

**Files created**:
- `components/alarm-modal.tsx`

**Files modified**:
- `app/layout.tsx`

---

### 12. Global Search (Ctrl+K Spotlight)

**What was done**:
- Created `app/api/search/route.ts` — searches across bookmarks, tasks, notes, and reminders server-side, returns top 20 results.
- Created `components/spotlight-search.tsx` — `Ctrl+K` / `Cmd+K` opens a spotlight overlay with debounced search, keyboard navigation (↑↓ Enter Esc), type badges, and direct navigation.
- Added to root layout so it works on every page.

**Files created**:
- `app/api/search/route.ts`
- `components/spotlight-search.tsx`

**Files modified**:
- `app/layout.tsx`

---

### 13. Dashboard / Home Page

**What was done**:
- Created `app/dashboard/page.tsx` — landing page showing today's summary: greeting, stats row (open tasks, completed today, active reminders, total bookmarks), overdue tasks, today's tasks, due reminders, today's notes, upcoming reminders, recent bookmarks.
- Tasks are clickable (links to `/tasks?task=<id>`) and completable inline.
- Updated `app/page.tsx` to redirect to `/dashboard` instead of `/bookmarks`.
- Added Dashboard link to all page nav bars (bookmarks, tasks, calendar, notes, reminders).

**Files created**:
- `app/dashboard/page.tsx`

**Files modified**:
- `app/page.tsx`
- `app/bookmarks/page.tsx`
- `app/tasks/page.tsx`
- `app/calendar/page.tsx`
- `app/notes/page.tsx`
- `app/reminders/page.tsx`

---

### 14. Recurring Tasks

**What was done**:
- Added `repeat` field (`String?`) to Task model in Prisma schema.
- Updated `app/api/tasks/route.ts` — when a recurring task is completed, auto-creates the next occurrence with the next due date (daily/weekly/monthly).
- Added repeat dropdown to task creation form and edit modal in `app/tasks/page.tsx`.
- Added purple repeat badge (with RepeatIcon) to all 3 task card renderings.

**Files modified**:
- `prisma/schema.prisma`
- `app/api/tasks/route.ts`
- `app/tasks/page.tsx`

---

### 15. Quick Add (Floating + Button)

**What was done**:
- Created `components/quick-add.tsx` — floating `+` button (bottom-right) that opens a panel to quickly create tasks, notes, bookmarks, or reminders from any page.
- Two-step flow: pick type → fill title + extra field → submit.
- Added to root layout.

**Files created**:
- `components/quick-add.tsx`

**Files modified**:
- `app/layout.tsx`
