# Nagish — Video Subtitling Tool

> **Demo note:** Works best with short videos (under ~2 minutes) — Gemini free tier request size and rate limits apply.

A production-leaning web app for automatic video subtitling. Drop in a video, generate captions via Google Gemini, edit them on a live timeline, and export a valid `.vtt` file.

---

## Features

- Drag & drop video upload (MP4, MOV, WebM, AVI)
- AI-powered transcription via **Google Gemini 2.5 Flash**
- Server-side keyframe extraction via **FFmpeg** (1fps)
- Interactive timeline with keyframe strip, cue blocks, and a live playhead
- Subtitle editor — inline text/timing edits, drag-to-reorder, delete
- Subtitle overlay on the video player synced to playback
- Export as `.vtt` file

---

## Stack

### Frontend
| Library | Purpose |
|---|---|
| React 19 + TypeScript + Vite | App framework |
| Tailwind CSS v4 | Utility styling |
| Radix UI Themes | Component system (Button, Badge, ScrollArea, etc.) |
| Zustand | Global client state |
| TanStack Query | Server state / mutations |
| react-dropzone | Drag & drop file upload |
| @dnd-kit/core + sortable | Subtitle row reordering |
| lucide-react | Icons |

### Backend
| Library | Purpose |
|---|---|
| Node.js + Express + TypeScript | API server |
| multer | Multipart video uploads |
| @google/generative-ai | Gemini transcription |
| fluent-ffmpeg | Keyframe extraction |
| dotenv | Environment config |

---

## Project Structure

```
nagish/
├── frontend/                        # Vite React app — port 5173
│   └── src/
│       ├── store/subtitleStore.ts   # Zustand store: video, cues, keyframes, status, error
│       ├── hooks/
│       │   ├── useTranscribe.ts     # TanStack useMutation — calls /api/transcribe + /api/keyframes
│       │   └── useVideoSync.ts      # timeupdate → active cue highlight
│       ├── components/
│       │   ├── DropZone/            # Drag & drop, triggers transcription
│       │   ├── VideoPlayer/         # <video> + subtitle overlay + status badge
│       │   ├── Timeline/            # Keyframe strip + cue bars + live playhead
│       │   ├── SubtitleEditor/      # Sortable table with inline editing
│       │   └── ExportButton/        # Client-side .vtt generation + download
│       ├── utils/
│       │   ├── vttExport.ts         # Pure fn: Cue[] → WEBVTT string
│       │   └── timeFormat.ts        # seconds ↔ HH:MM:SS.mmm
│       └── types/subtitle.ts        # Cue, TranscriptionStatus
│
└── backend/                         # Express API — port 8000
    └── src/
        ├── index.ts                 # App entry, CORS, /static file serving
        ├── routes/
        │   ├── transcription.ts     # POST /api/transcribe
        │   └── keyframes.ts         # POST /api/keyframes
        └── services/
            ├── whisperService.ts    # Gemini API → Cue[]
            └── keyframeService.ts   # ffmpeg → JPEG frames → /static URLs
```

---

## API

```
POST /api/transcribe
  body: multipart/form-data { video: File }
  response: { cues: { id, startTime, endTime, text }[] }

POST /api/keyframes
  body: multipart/form-data { video: File }
  response: { keyframes: string[] }    // /static/keyframes/{jobId}/frame_XXXX.jpg

GET /static/**                         // serves backend/storage/
```

Both requests are fired concurrently via `Promise.all` in `useTranscribe`.

---

## State Shape

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
}
```

---

## Environment

```bash
# backend/.env
GEMINI_API_KEY=your_key_here
PORT=8000
```

---

## Running with Docker (recommended)

### Prerequisites
- Docker & Docker Compose v2+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
```

### 2. Build and start

```bash
docker compose up --build
```

Open **http://localhost**

### How it works

```
Browser → nginx (port 80)
            ├── / → serves React SPA (static files built into the image)
            ├── /api/* → proxied to backend:8000
            └── /static/* → proxied to backend:8000 (keyframe images)
```

- **Frontend** — multi-stage build: Node 22 compiles the Vite/React app, output served by nginx 1.27.
- **Backend** — multi-stage build: Node 22 compiles TypeScript; production image runs `node dist/index.js`. FFmpeg is provided by the bundled `@ffmpeg-installer/ffmpeg` npm package (no system dependency).
- **Storage** — keyframe images are written to a named Docker volume (`backend_storage`) so they survive container restarts.
- **CORS** — configured via `CORS_ORIGIN` env var (defaults to `http://localhost:5173` for local dev, set to `http://localhost` in Docker).

### Stopping

```bash
docker compose down          # stop containers, keep volume
docker compose down -v       # stop and delete storage volume
```

---

## Running Locally (dev)

```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

Open **http://localhost:5173**
