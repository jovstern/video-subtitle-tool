# Video Subtitling Tool — Project Prompt

> **Demo note:** This demo works best with short videos (under ~2 minutes). Longer videos may fail or time out due to Gemini's free tier request size and rate limits.

Build a production-leaning web app where a user can:

- Drag a video file into the app
- Preview and scrub the video
- Trigger automatic caption generation from the audio track using Google Gemini
- View and edit the generated subtitles: update text, timing, reorder, delete
- See video keyframes on a timeline when scrubbing
- Export the subtitle track as a `.vtt` file

---

## Stack

### Frontend
- **React 19 + TypeScript** via Vite
- **Tailwind CSS v4** (`@tailwindcss/vite`) for all layout and utility styling
- **Radix UI Themes** (`@radix-ui/themes`) for components: Button, Badge, Text, ScrollArea, IconButton
- **Zustand** for global state (video file, cues, keyframes, transcription status)
- **@tanstack/react-query** for data fetching — use `useMutation` with native `fetch`, no axios
- **react-dropzone** for drag & drop video upload
- **@dnd-kit/core + @dnd-kit/sortable** for drag-to-reorder subtitle rows
- **lucide-react** for all icons — no raw SVGs anywhere

### Backend
- **Node.js + Express + TypeScript** (`ts-node` for dev)
- **multer** for multipart video file uploads
- **Google Gemini API** (`@google/generative-ai`) — model `gemini-2.5-flash` — for audio transcription
- **fluent-ffmpeg + @ffmpeg-installer/ffmpeg** for server-side keyframe extraction
- **dotenv** for environment config

---

## Architecture

```
nagish/
├── frontend/          # Vite React app (port 5173)
│   └── src/
│       ├── store/subtitleStore.ts       # Zustand: video, cues, keyframes, status
│       ├── hooks/
│       │   ├── useTranscribe.ts         # useMutation: POST /api/transcribe + /api/keyframes
│       │   └── useVideoSync.ts          # syncs video timeupdate → active cue highlight
│       ├── components/
│       │   ├── DropZone/                # drag & drop, triggers useTranscribe
│       │   ├── VideoPlayer/             # <video> with subtitle overlay + status badge
│       │   ├── Timeline/                # keyframe strip + draggable cue blocks
│       │   ├── SubtitleEditor/          # sortable table, inline text/time editing
│       │   └── ExportButton/            # generates + downloads .vtt file
│       ├── utils/
│       │   ├── vttExport.ts             # pure fn: Cue[] → WEBVTT string
│       │   └── timeFormat.ts            # seconds ↔ HH:MM:SS.mmm
│       └── types/subtitle.ts            # Cue, TranscriptionStatus
│
└── backend/           # Express API (port 8000)
    └── src/
        ├── index.ts                     # app entry, CORS, static files
        ├── routes/
        │   ├── transcription.ts         # POST /api/transcribe
        │   └── keyframes.ts             # POST /api/keyframes
        └── services/
            ├── whisperService.ts        # Gemini API → Cue[]
            └── keyframeService.ts       # ffmpeg → keyframe images → /static/...
```

---

## Backend API

```
POST /api/transcribe
  body: multipart/form-data { video: File }
  response: { cues: { id, startTime, endTime, text }[] }

POST /api/keyframes
  body: multipart/form-data { video: File }
  response: { keyframes: string[] }   // /static/keyframes/{jobId}/frame_XXXX.jpg URLs

GET /static/**            // serves storage/ directory (keyframe images)
```

Transcription uses `gemini-2.5-flash` with an inline base64 video payload. It prompts Gemini to return a JSON array of subtitle segments with `startTime`, `endTime`, and `text`.

Both requests are fired concurrently via `Promise.all` in `useTranscribe`.

---

## State Shape (Zustand)

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
  // actions: setVideo, setCues, updateCue, deleteCue, reorderCues,
  //          selectCue, setKeyframes, setTranscriptionStatus, reset
}
```

---

## Layout & Design

- **Header**: sticky, white, `Nagish` logo in indigo. Right side: "Load different video" button (only when video loaded) + Export .vtt button (only when cues exist)
- **Drop zone**: centered 700×500px, dashed border, indigo accent on hover/drag, Gemini icon
- **Workspace** (after upload):
  - Top-left: video player (fixed, with filename + file size badge above)
  - Top-right: subtitle editor (1/3 width, scrollable table with spinner while loading)
  - Bottom: timeline (full workspace width) — keyframe strip + cue bars
- **Video player**: 700×500 black container, subtitle overlay above controls, status badge (spinner while uploading/processing, red on error)
- **Timeline**: dark keyframe strip (1fps frames), colored indigo cue blocks positioned by time percentage, click to seek
- **Subtitle editor**: Radix ScrollArea wrapping a table, sticky header, drag handle (GripVertical), inline number inputs for timing, textarea for text, red trash icon to delete. Selected row highlighted in indigo.
- **Color palette**: indigo-500 accent, gray-50/200 borders and backgrounds, white surfaces

---

## Environment

```
# backend/.env
GEMINI_API_KEY=your_key_here
PORT=8000
```

---

## Running

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

Open http://localhost:5173
