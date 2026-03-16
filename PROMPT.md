I am building a production-leaning video subtitling tool as a technical assessment. Act as my Senior Full-Stack Pairing
Partner. The focus is heavily on the frontend — the backend should be minimal and simple, just enough to support
transcription and keyframe extraction.

---

## What I'm Building

A web app where the user can:

- Drag and drop a video file
- Preview and scrub it using the native HTML `<video>` element — no third-party player
- Trigger automatic caption generation from the audio via Google Gemini
- Edit the generated subtitles: text, timing, reorder, delete
- See keyframes on a timeline, with a live playhead synced to the video
- Export the subtitles as a `.vtt` file

---

## Frontend

This is the main focus. Keep components clean, typed, and easy to extend.

**Framework & Build**

- React 19 + TypeScript, bundled with Vite
- `verbatimModuleSyntax: true` in tsconfig — always `import type` for type-only imports

**Styling**

- Tailwind CSS v4 via `@tailwindcss/vite` — all layout and utility classes
- Radix UI Themes (`@radix-ui/themes`) for component-level UI: `Button`, `Badge`, `Text`, `ScrollArea`, `IconButton`
- Prefer Radix Theme primitives (`Box`, `Flex`, `Button`, `Text`, etc.) over raw HTML elements (`div`, `button`, `p`)

**State**

- Centralised store avoids props drilling as the app grows; video state and subtitle cues live together because they
  must stay in sync (playhead, active cue, keyframes all derive from the same source of truth)
- Zustand for all global client state: video file, object URL, duration, cues, keyframes, transcription status + error
- TanStack Query (`@tanstack/react-query`) for server mutations — `useMutation` with native `fetch`, no axios

**Video**

- Native HTML `<video>` element with a `ref` — no wrapper library
- `timeupdate` event drives active cue highlight and timeline playhead position
- `durationchange` event sets video duration in the store

**Drag & Drop**

- `react-dropzone` for video file drop
- `@dnd-kit/core` + `@dnd-kit/sortable` for subtitle row reordering

**Icons**

- `lucide-react` only — no raw SVGs anywhere in the codebase

**Key Hooks**

- `useTranscribe` — custom hook wrapping `useMutation`, fires `/api/transcribe` and `/api/keyframes` concurrently,
  writes results to Zustand store
- `useVideoSync` — attaches `timeupdate` and `durationchange` listeners to the video ref, syncs active cue selection

---

## Backend

Keep it simple. Node.js + Express + TypeScript. Two endpoints and static file serving, nothing more.

**Stack**

- Express + TypeScript (`ts-node` for dev)
- `multer` for multipart video uploads
- `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` for keyframe extraction
- `@google/generative-ai` for transcription
- `dotenv` for config

**Endpoints**

```
POST /api/transcribe   — receives video, calls Gemini, returns cues[]
POST /api/keyframes    — receives video, runs ffmpeg at 1fps, returns static URLs
GET  /static/**        — serves backend/storage/ (keyframe images)
```

**Core backend operations:**

- **Keyframe extraction** — splits the video into JPEG images using `fluent-ffmpeg` at 1fps; frames saved to
  `backend/storage/keyframes/{jobId}/`
- **Transcription** — sends the video to the Gemini AI agent (base64 inline), which returns a structured JSON array of
  subtitle cues

---

## Gemini Transcription

Model: `gemini-2.5-flash`

The video is read as base64 and sent inline. The prompt instructs Gemini to return a strict JSON array only:

```
Transcribe the audio from this video into subtitle segments.
Return ONLY a valid JSON array with no markdown or explanation.
Each item: { "startTime": float, "endTime": float, "text": string }
```

Response is stripped of any markdown fences and parsed directly into `Cue[]`.

> **Note:** Works best with short videos (<2 min) — Gemini free tier limits apply on payload size and rate.

---

## State Shape

```typescript
interface Cue {
    id: string;
    startTime: number;
    endTime: number;
    text: string
}

type TranscriptionStatus = 'idle' | 'uploading' | 'done' | 'error'

interface SubtitleStore {
    videoFile: File | null
    videoObjectURL: string | null
    videoDuration: number
    keyframes: string[]          // /static/keyframes/{jobId}/frame_XXXX.jpg
    cues: Cue[]
    selectedCueId: string | null
    transcriptionStatus: TranscriptionStatus
    transcriptionError: string | null
}
```

---

## Feature Specs

### Video Player

- Renders a native `<video>` element via a stable React `ref` passed down from the root
- Shows a drag-and-drop zone (`react-dropzone`) when no file is loaded; replaced by the player once a file is set
- Controls: play/pause toggle, current-time display, duration display — built with Radix `IconButton` / `Button`
- Triggers transcription + keyframe extraction via `useTranscribe` after a file is dropped
- The `ref` is the single source of truth for playback; do not mirror `currentTime` in the store — read it from the element directly

### Subtitle Editor

- Scrollable list of cue rows (`ScrollArea` from Radix), one row per `Cue` in the store
- Each row shows: start time, end time, text — all inline-editable (controlled inputs)
- Active cue (matching `selectedCueId`) is visually highlighted
- Rows are drag-reorderable via `@dnd-kit/sortable`; store is updated on drop
- Delete button per row (Radix `IconButton` + lucide `Trash2` icon)
- Time inputs accept `HH:MM:SS.mmm` format; validate and clamp on blur

### Timeline with Cues

- Horizontal scrollable track scaled to `videoDuration`
- Keyframe thumbnails rendered as evenly-spaced `<img>` tags along the bottom of the track
- Each cue rendered as a positioned block whose `left` and `width` are derived from `startTime / videoDuration` and `(endTime - startTime) / videoDuration`
- Clicking a cue block seeks the video and sets `selectedCueId` in the store
- Live playhead: a vertical line whose `left` is updated on every `timeupdate` event (no store write — direct DOM style mutation for performance)
- Clicking an empty area on the track seeks the video to that timestamp

---

## Subtitle Caching

Transcription is slow and costly — cache results keyed by file identity so the user never waits twice for the same video.

**Key:**  `{filename}-{filesize}-{lastModified}` — cheap to compute, no hashing needed

**Storage:** `localStorage` under `nagish:subtitles:{key}`

**Shape stored:**
```typescript
interface CachedSubtitles {
  key: string
  cues: Cue[]
  cachedAt: number   // Date.now()
}
```

**Rules:**
- On file drop: compute key, check `localStorage` — if hit, load cues into store and skip the API call entirely
- On transcription success: write result to `localStorage` before writing to the store
- TTL: treat entries older than 7 days as stale and ignore them (check `cachedAt` on read)
- Keep cache writes inside `useTranscribe` — no cache logic inside components

---

## Further Features

### Frontend

- [ ] Timeline cue resize — drag edges to adjust `startTime` / `endTime`
- [ ] Add cue manually — double-click on timeline to insert at timestamp
- [ ] Cue overlap validation — highlight conflicting rows in the editor
- [ ] Keyboard shortcuts — space (play/pause), delete (remove cue), arrows (step)
- [ ] Undo/redo — Zustand middleware (`zundo`)
- [ ] Upload progress — XHR instead of fetch for real percentage
- [ ] Waveform on timeline — Web Audio API

### Backend / Scaling

- [ ] Gemini File API — replace base64 inline for videos >20MB
- [ ] Job queue — BullMQ + Redis, non-blocking transcription with SSE/WebSocket push
- [ ] Storage cleanup — TTL or cron to purge temp files
- [ ] Multiple providers — abstract transcription behind an interface (Whisper, AssemblyAI)
- [ ] Docker — `Dockerfile` + `docker-compose.yaml` for both services
