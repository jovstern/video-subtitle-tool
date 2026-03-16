# Implementation Plan — Nagish Video Subtitling Tool

## Goal

Build a production-leaning video subtitling MVP. User drops a video, gets AI-generated captions, edits them on a live timeline, and exports a `.vtt` file. Frontend is the main focus — backend is minimal support only.

---

## Phase 1 — Project Scaffold

**Backend**
- Init Node.js + Express + TypeScript project
- Set up `ts-node` for dev, `dotenv` for env config
- Configure CORS for `localhost:5173`
- Mount `/static` to serve `backend/storage/`

**Frontend**
- Init Vite + React 19 + TypeScript
- Install and configure Tailwind CSS v4 via `@tailwindcss/vite`
- Install and configure Radix UI Themes — wrap app in `<Theme>`
- Set up TanStack Query — wrap app in `<QueryClientProvider>`
- Configure Vite proxy: `/api` → `http://localhost:8000`

---

## Phase 2 — State & Data Layer

**Zustand Store** (`store/subtitleStore.ts`)
```ts
interface Cue { id: string; startTime: number; endTime: number; text: string }
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
  // actions: setVideo, setCues, updateCue, deleteCue, reorderCues,
  //          selectCue, setKeyframes, setTranscriptionStatus, reset
}
```

**`useTranscribe` hook** (`hooks/useTranscribe.ts`)
- `useMutation` wrapping native `fetch`
- Fires `POST /api/transcribe` and `POST /api/keyframes` concurrently via `Promise.all`
- On success: writes `cues` + `keyframes` to store, sets status `'done'`
- On error: writes error message to store, sets status `'error'`

**`useVideoSync` hook** (`hooks/useVideoSync.ts`)
- Attaches `timeupdate` → finds active cue by time → `store.selectCue`
- Attaches `durationchange` → `store.setVideoDuration`

---

## Phase 3 — Backend Endpoints

**`POST /api/transcribe`** (`routes/transcription.ts`)
- `multer` receives video file
- `whisperService.ts` reads file as base64, sends to Gemini with strict JSON prompt
- Parses response into `Cue[]`, returns to client
- Cleans up temp file after response

**`POST /api/keyframes`** (`routes/keyframes.ts`)
- `multer` receives video file
- `keyframeService.ts` runs `fluent-ffmpeg` at 1fps, saves JPEGs to `storage/keyframes/{jobId}/`
- Returns array of `/static/keyframes/{jobId}/frame_XXXX.jpg` URLs
- Cleans up source video after extraction

**Gemini Prompt**
```
Transcribe the audio from this video into subtitle segments.
Return ONLY a valid JSON array with no markdown or explanation.
Each item: { "startTime": float, "endTime": float, "text": string }
```

---

## Phase 4 — Core UI Components

**`DropZone`**
- `react-dropzone`, accepts `video/*` only
- On drop: calls `store.setVideo(file)` then `mutate(file)` from `useTranscribe`
- Disabled + dimmed while mutation is pending
- Shows free-tier note below supported formats

**`VideoPlayer`**
- Native HTML `<video ref>` — no wrapper library
- Fixed 700×500px black container
- Filename + file size badge rendered above
- Custom subtitle overlay div positioned above native controls, reads `selectedCueId` from store
- Status badge: spinner while uploading, error state with message

**`SubtitleEditor`**
- Radix `ScrollArea` wrapping a `<table>`
- `DndContext` + `SortableContext` from `@dnd-kit` for row reorder — `DndContext` must wrap the table, not sit inside it
- Each `CueRow`: `GripVertical` drag handle, number inputs for `startTime`/`endTime`, textarea for text, `Trash2` delete button
- Spinner overlay while loading, error overlay with message when failed
- Selected row highlighted

**`ExportButton`** / Header Actions
- Always visible, disabled when no cues / no video
- Export: client-side `Cue[]` → WEBVTT string → `Blob` download named after source file
- Load different video: calls `store.reset()`

---

## Phase 5 — Timeline

**`KeyframeStrip`**
- Horizontal flex row of `<img>` tags, height 56px, dark background
- Images sourced from `store.keyframes` (URLs from backend)

**`CueBlock`**
- Positioned absolutely at `(startTime / duration) * 100%`, width proportional to duration
- Click → seek video + select cue
- Drag → update `startTime`/`endTime` in store

**`Timeline`** (container)
- `relative` wrapper — both strip and cue layer sit inside it
- Cue layer: `position: relative`, click seeks video
- White 1px playhead: `position: absolute`, `left` driven by `currentTime / duration * 100%`, smooth via `transition-[left] duration-100 ease-linear`
- `currentTime` tracked locally via `timeupdate` listener on `videoRef`

---

## Phase 6 — Layout & Design

```
┌─ Header (sticky) ──────────────────────────────────────┐
│  Nagish (indigo)              [Load video]  [Export]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [VideoPlayer 700×500]        [SubtitleEditor 1/3]     │
│   filename  size badge         scrollable table        │
│                                                        │
│  [Timeline — full width]                               │
│   keyframe strip + cue blocks + playhead               │
└────────────────────────────────────────────────────────┘
```

- **Palette:** indigo-500 accent, gray-50/200 surfaces and borders, white cards
- **Icons:** `lucide-react` only — no raw SVGs
- **Typography:** Radix `Text` / `Heading` components

---

## Further Features (Backlog)

### Frontend
- [ ] Timeline cue resize — drag edges to adjust `startTime` / `endTime`
- [ ] Add cue manually — double-click timeline to insert at timestamp
- [ ] Cue overlap validation — highlight conflicting rows
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
