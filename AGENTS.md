# Mini Task Tracker

React and TypeScript single-page application built with Vite. Tasks and the next ID are stored in browser localStorage under the key `tasks`.

## Repository map

- `src/App.tsx` renders the form, filters, task list, and feedback.
- `src/useTaskStore.ts` applies actions and persists state before updating the UI.
- `src/tasks.ts` contains pure task operations and filtering.
- `src/storage.ts` parses and serializes persisted state.
- `src/*.test.ts` contains Vitest tests. Add UI tests alongside the relevant components when needed.

## Setup and checks

Node.js 24.22.3 was verified for the source export. From the repository root, run `npm ci` using the checked-in lockfile. Run `npm test`, `npm run build`, and `git diff --check` before requesting review. The build includes TypeScript checking. Run `npm run dev` for local manual checks with synthetic tasks. Review `git status --short` and `git diff` before and after edits.

## Implementation rules

Follow the existing TypeScript and React style. Treat stored JSON as untrusted input. Keep task operations deterministic, preserve existing valid saved lists, and maintain unique task IDs. Persist a proposed change before showing it as committed. Test failure paths with isolated fake storage. Keep patches focused and document any change to user-visible behavior.

## Permissions and review

For a read-only review, inspect files and report findings with evidence. For approved edits, use the assigned branch or worktree and limit changes to the scoped files. Do not access or disclose secrets or real user data. Do not clear browser storage, run destructive Git or filesystem commands, change dependencies or the lockfile without review, push to the default branch, merge, or deploy. Use a fresh browser profile or fixtures when experimenting with stored records.

Report the changed files, relevant diff, exact commands, actual outcomes, skipped checks, and residual risks. A human reviews the diff and evidence and approves any merge or deployment. If a check fails, stop escalation to release, report the cause and preserve the branch for review.
