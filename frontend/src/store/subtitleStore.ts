import { create } from 'zustand'
import type { Cue, TranscriptionStatus } from '../types/subtitle'

interface SubtitleStore {
  videoFile: File | null
  videoObjectURL: string | null
  videoDuration: number
  keyframes: string[]
  cues: Cue[]
  selectedCueId: string | null
  transcriptionStatus: TranscriptionStatus
  transcriptionError: string | null
  uploadProgress: number

  setVideo: (file: File) => void
  setVideoDuration: (duration: number) => void
  setKeyframes: (keyframes: string[]) => void
  setCues: (cues: Cue[]) => void
  updateCue: (id: string, patch: Partial<Omit<Cue, 'id'>>) => void
  deleteCue: (id: string) => void
  reorderCues: (fromIndex: number, toIndex: number) => void
  selectCue: (id: string | null) => void
  setTranscriptionStatus: (status: TranscriptionStatus, error?: string) => void
  setUploadProgress: (progress: number) => void
  reset: () => void
}

export const useSubtitleStore = create<SubtitleStore>((set) => ({
  videoFile: null,
  videoObjectURL: null,
  videoDuration: 0,
  keyframes: [],
  cues: [],
  selectedCueId: null,
  transcriptionStatus: 'idle',
  transcriptionError: null,
  uploadProgress: 0,

  setVideo: (file) => {
    const prev = useSubtitleStore.getState().videoObjectURL
    if (prev) URL.revokeObjectURL(prev)
    set({
      videoFile: file,
      videoObjectURL: URL.createObjectURL(file),
      cues: [],
      keyframes: [],
      selectedCueId: null,
      transcriptionStatus: 'idle',
      transcriptionError: null,
      uploadProgress: 0,
    })
  },

  setVideoDuration: (duration) => set({ videoDuration: duration }),
  setKeyframes: (keyframes) => set({ keyframes }),
  setCues: (cues) => set({ cues }),

  updateCue: (id, patch) =>
    set((state) => ({
      cues: state.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  deleteCue: (id) =>
    set((state) => ({
      cues: state.cues.filter((c) => c.id !== id),
      selectedCueId: state.selectedCueId === id ? null : state.selectedCueId,
    })),

  reorderCues: (fromIndex, toIndex) =>
    set((state) => {
      const cues = [...state.cues]
      const [moved] = cues.splice(fromIndex, 1)
      cues.splice(toIndex, 0, moved)
      return { cues }
    }),

  selectCue: (id) => set({ selectedCueId: id }),
  setTranscriptionStatus: (status, error) => set({ transcriptionStatus: status, transcriptionError: error ?? null }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  reset: () =>
    set({
      videoFile: null,
      videoObjectURL: null,
      videoDuration: 0,
      keyframes: [],
      cues: [],
      selectedCueId: null,
      transcriptionStatus: 'idle',
      transcriptionError: null,
      uploadProgress: 0,
    }),
}))
