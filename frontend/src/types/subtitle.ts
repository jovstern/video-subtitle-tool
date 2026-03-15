export interface Cue {
  id: string
  startTime: number // seconds
  endTime: number   // seconds
  text: string
}

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
