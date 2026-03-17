export interface Cue {
    id: string
    startTime: number
    endTime: number
    text: string
}

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
