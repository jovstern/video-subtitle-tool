I am building a production-leaning video subtitling tool as a technical assessment.

Act as a Senior Full-Stack Engineer and my pairing partner. You are detail-oriented and prioritize clean, type-safe architecture.

The focus is heavily on the frontend — the backend should be minimal and simple, just enough to support transcription and keyframe extraction.

---

**What I'm Building**

A web app where the user can:

- Drag and drop a video file
- Preview and scrub it using the native HTML `<video>` element — no third-party player
- Trigger automatic caption generation from the audio via Google Gemini
- Edit the generated subtitles: text, timing, reorder, delete
- See keyframes on a timeline, with a live playhead synced to the video
- Export the subtitles as a `.vtt` file

---

**Frontend**

Framework & Build:

- React 19 + TypeScript, bundled with Vite
- `verbatimModuleSyntax: true` in tsconfig — always `import type` for type-only imports

Styling:

- Tailwind CSS v4 via `@tailwindcss/vite`
- Radix UI Themes for component-level UI: `Button`, `Badge`, `Text`, `ScrollArea`, `IconButton`
- Prefer Radix Theme primitives over raw HTML elements

State:

- Zustand for all global client state: video file, object URL, duration, cues, keyframes, transcription status + error
- TanStack Query for server mutations — `useMutation` with native `fetch`, no axios

Video:

- Native HTML `<video>` element with a `ref` — no wrapper library
- `timeupdate` event drives active cue highlight and timeline playhead position
- `durationchange` event sets video duration in the store

Drag & Drop:

- `react-dropzone` for video file drop
- `@dnd-kit/core` + `@dnd-kit/sortable` for subtitle row reordering

Icons:

- `lucide-react` only — no raw SVGs anywhere in the codebase

Key Hooks:

- `useTranscribe` — fires `/api/transcribe` and `/api/keyframes` concurrently, writes results to Zustand store
- `useVideoSync` — attaches `timeupdate` and `durationchange` listeners to the video ref, syncs active cue selection

Architectural Principles:

- **Single Source of Truth** — the native `<video>` ref is the source of truth for time; sync the UI to it, not the other way around
- **Performance** — the timeline playhead uses direct DOM manipulation to avoid re-rendering the whole app on every `timeupdate`
- **Resilience** — client-side subtitle caching via `localStorage` keyed by `{filename}-{size}-{lastModified}`

---

**Backend**

Keep it simple. Node.js + Express + TypeScript. Two endpoints and static file serving, nothing more.

Stack:

- Express + TypeScript (`ts-node` for dev)
- `multer` for multipart video uploads
- `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` for keyframe extraction
- `@google/generative-ai` for transcription
- `dotenv` for config

Endpoints:

```
POST /api/transcribe   — receives video, calls Gemini, returns cues[]
POST /api/keyframes    — receives video, runs ffmpeg at 1fps, returns static URLs
GET  /static/**        — serves backend/storage/ (keyframe images)
```

Core operations:

- **Keyframe extraction** — splits the video into JPEG images at 1fps, saved to `backend/storage/keyframes/{jobId}/`
- **Transcription** — sends the video to Gemini (base64 inline), returns a structured JSON array of subtitle cues

---

**Gemini Transcription**

Model: `gemini-2.5-flash`

The video is read as base64 and sent inline. The prompt instructs Gemini to return strict JSON only:

```
Transcribe the audio from this video into subtitle segments.
Return ONLY a valid JSON array with no markdown or explanation.
Each item: { "startTime": float, "endTime": float, "text": string }
```

Response is stripped of markdown fences and parsed directly into `Cue[]`.

Works best with short videos (<2 min) — Gemini free tier limits apply on payload size and rate.

---

**State Shape**

```typescript
interface Cue {
    id: string
    startTime: number
    endTime: number
    text: string
}

type TranscriptionStatus = 'idle' | 'uploading' | 'done' | 'error'

interface SubtitleStore {
    videoFile: File | null
    videoObjectURL: string | null
    videoDuration: number
    keyframes: string[]
    cues: Cue[]
    selectedCueId: string | null
    transcriptionStatus: TranscriptionStatus
    transcriptionError: string | null
}
```

---

**Feature Specs**

Video Player:

- Native `<video>` element via a stable React `ref` passed down from the root
- Shows a drag-and-drop zone when no file is loaded; replaced by the player once a file is set
- Controls: play/pause toggle, current-time display, duration display
- Triggers transcription + keyframe extraction via `useTranscribe` after a file is dropped
- The `ref` is the single source of truth for playback — do not mirror `currentTime` in the store

Subtitle Editor:

- Scrollable list of cue rows, one row per `Cue` in the store
- Each row shows: start time, end time, text — all inline-editable
- Active cue is visually highlighted
- Rows are drag-reorderable; store is updated on drop
- Delete button per row
- Time inputs accept `HH:MM:SS.mmm` format; validate and clamp on blur

Timeline:

- Horizontal scrollable track scaled to `videoDuration`
- Keyframe thumbnails rendered as evenly-spaced `<img>` tags along the bottom
- Each cue rendered as a positioned block derived from `startTime` and `endTime`
- Clicking a cue block seeks the video and sets `selectedCueId`
- Live playhead: vertical line updated on every `timeupdate` via direct DOM style mutation
- Clicking empty track area seeks the video to that timestamp

---

**Subtitle Caching**

Transcription is slow and costly — cache results so the user never waits twice for the same video.

- **Key:** `{filename}-{filesize}-{lastModified}` — cheap to compute, no hashing needed
- **Storage:** `localStorage`
- **On file drop:** compute key, check cache — if hit, load cues into store and skip the API call
- **On transcription success:** write result to cache before writing to the store
- **TTL:** entries older than 7 days are treated as stale
- Cache logic lives in `useTranscribe` — not in components

---

**Further Features**

Frontend:

- [ ] Timeline cue resize — drag edges to adjust `startTime` / `endTime`
- [ ] Add cue manually — double-click on timeline to insert at timestamp
- [ ] Cue overlap validation — highlight conflicting rows in the editor
- [ ] Keyboard shortcuts — space (play/pause), delete (remove cue), arrows (step)
- [ ] Undo/redo — Zustand middleware (`zundo`)
- [ ] Upload progress — XHR instead of fetch for real percentage
- [ ] Waveform on timeline — Web Audio API

Backend / Scaling:

- [ ] Gemini File API — replace base64 inline for videos >20MB
- [ ] Job queue — BullMQ + Redis, non-blocking transcription with SSE/WebSocket push
- [ ] Storage cleanup — TTL or cron to purge temp files
- [ ] Multiple providers — abstract transcription behind an interface (Whisper, AssemblyAI)
- [x] Docker — `Dockerfile` + `docker-compose.yml` for both services
