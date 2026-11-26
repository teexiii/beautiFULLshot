---
status: done
frontend_stack: react
risk_tier: small
source: user request 2026-11-26 (no brainstorm report; request used as spec)
---

# Plan — Fork, merge both working copies, copy saved path on Ctrl+S, release MSI

## Scope

1. Merge the fill-color work from `D:\tee\git\_temp\beautiFULLshot` (3 files, no overlap) into this working copy, which already holds auto-copy + Ctrl+S dedup + release scripts.
2. New behavior: after Quick Save (Ctrl+S) writes the image, the saved file's full path is copied to the clipboard as text. Ctrl+C still copies the image.
3. Fork `itsddvn/beautiFULLshot` to the user's GitHub, push `main` there.
4. Bump version, build the Windows MSI locally, open the installer.

Out of scope: Save As dialog (does not copy the path), a settings toggle, Rust changes beyond one capability permission.

## Phase 01 — Merge fill color (copy files)

Copy from `_temp` to this repo, same relative paths:
- `src/components/toolbar/color-picker-modal.tsx` (new)
- `src/components/toolbar/tool-settings.tsx`
- `README.md`

## Phase 02 — Copy saved path after Quick Save (test first)

Files:
- `src/utils/file-api.ts` — add `copyPathToClipboard(path: string): Promise<boolean>`: normalizes with `normalizePath`, calls `writeText` from `@tauri-apps/plugin-clipboard-manager`, returns false and logs on failure (never throws).
- `src/utils/__tests__/file-api.test.ts` (new) — written first, failing: writes the normalized path; strips `\\?\`; returns false without throwing when `writeText` rejects.
- `src/hooks/use-export.ts` — in `quickSave`: after a successful write call `copyPathToClipboard(displayPath)`; in the dedup branch ("Already saved") copy `lastSavePath` too, so Ctrl+S always leaves the path on the clipboard. Toast text says the path was copied only when the copy succeeded. `copyToClipboard` (Ctrl+C) and `saveAs` untouched.
- `src-tauri/capabilities/default.json` — add `clipboard-manager:allow-write-text` (the plugin's default set grants nothing).
- `README.md` — one line in Features about the path copy.

## Phase 03 — Verify

- `npx tsc --noEmit`, `npm test -- --run` green.

## Phase 04 — Fork, commit, push, release (controller session)

- `gh repo fork`, `origin` → user fork, `upstream` → itsddvn.
- Focused commits, push `main`.
- `node scripts/bump-version.mjs patch`, `tauri build --bundles msi` with `tauri.local-release.conf.json`, open the MSI.

## Acceptance criteria

- Ctrl+S on a new image: file written, clipboard holds its full path (text), toast confirms.
- Ctrl+S again without edits: no new file, clipboard holds the existing path.
- Ctrl+C: clipboard holds the image, as before.
- Fill picker appears for rectangle/ellipse; stroke picker unchanged.
- Typecheck and tests green; MSI built and opened; fork `main` contains all of it.

## Risks

- Path-copy failure must not turn a successful save into "Save Failed" → helper swallows and logs.
- Missing capability permission would fail silently at runtime only in the built app → permission added, checked in the installed build.
- Auto-copy puts the image on the clipboard at capture; Ctrl+S then replaces it with the path. That is the requested behavior.
