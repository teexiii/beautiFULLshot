---
status: pending
frontend_stack: react
source: plans/reports/brainstorm-260722-1733-auto-copy-and-ctrl-s-dedup-report.md
---

# Plan — Auto-copy on capture + content-aware Ctrl+S dedup + release .bat

## Overview

Three deliverables:
1. Auto-copy the beautified result to clipboard on every new image (all sources), gated by a Settings toggle (default ON).
2. Content-aware Quick Save (Ctrl+S): unchanged content → skip write + "Already saved" toast; changed content → new file, millisecond-precision name (no clobber).
3. Windows release `.bat`: bump version → build → (MSI silent install OR tag-push release). Semantics confirmed with user before running.

Stack: Tauri v2 + React 19 + Konva + Zustand. Frontend-only (no Rust change). Execution agent: /ck:frontend-design (done inline — small scope).

## Phases

| Phase | Name | Files | Dep |
|-------|------|-------|-----|
| 01 | Auto-copy on new image | canvas-store, settings-store, settings-modal, use-export, use-auto-copy (new), editor-layout | — |
| 02 | Ctrl+S content-aware dedup | export-utils, export-store, use-export | — |
| 03 | Release .bat (Windows) | scripts/release.bat (new) | 01,02 green |

## Acceptance criteria

- Every new image (capture/drag/paste) auto-copies beautified output when toggle ON; nothing when OFF; manual Ctrl+C unchanged.
- Ctrl+S unchanged content → 0 new files + "Already saved" toast; after edit → new file; rapid distinct saves never overwrite.
- `npm test -- --run` + `npx tsc --noEmit` green.
- `scripts/release.bat` bumps version across package.json/tauri.conf.json/Cargo.toml consistently.

## Risks

- Auto-copy render timing vs async screenshot/wallpaper image load → delay-based (200ms) after fitToView; blank-copy risk only for persisted wallpaper backgrounds.
- FNV-1a 32-bit hash collision (~1/4e9) → false "unchanged"; negligible for real edits.
- Release execution is outward-facing/irreversible → confirm path (local MSI install vs tag-push CI) before running.
