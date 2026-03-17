# Plan: Subtitle Caching

## Phase 1 — Cache Utility
- Create `frontend/src/utils/subtitleCache.ts`
  - Cache key: `${file.name}|${file.size}|${file.lastModified}`
  - Read/write `Cue[]` to `localStorage` under key `nagish_subtitle_cache`
  - Store as map: `{ [fileKey]: Cue[] }`
  - Cap stored entries (e.g. 20 most recent) to avoid localStorage bloat

## Phase 2 — Hook Integration
- In `useTranscribe.ts`, before calling `/api/transcribe`:
  - Compute file fingerprint
  - If cache hit → load cues from cache, skip API call, set `isFromCache = true` in store
  - If cache miss → call API as normal, store result in cache after success

## Phase 3 — Store Update
- Add `isFromCache: boolean` field to `subtitleStore.ts`
- Reset to `false` on new upload / clear

## Phase 4 — Visual Indicator
- In `SubtitleEditor.tsx` header (or near the video player), show a small badge when `isFromCache === true`
- Style: subtle green/teal pill — e.g. "⚡ From cache"

---

## Open Questions
1. Should cached subtitles be user-editable and re-saved to cache, or is the cache read-only (original AI output only)?
2. Should there be a "clear cache" / "re-generate" button to force a fresh transcription?
