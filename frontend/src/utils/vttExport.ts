import type { Cue } from '../types/subtitle'
import { secondsToVtt } from './timeFormat'

export function exportVtt(cues: Cue[]): string {
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime)
  const lines = ['WEBVTT', '']
  sorted.forEach((cue, i) => {
    lines.push(String(i + 1))
    lines.push(`${secondsToVtt(cue.startTime)} --> ${secondsToVtt(cue.endTime)}`)
    lines.push(cue.text)
    lines.push('')
  })
  return lines.join('\n')
}

export function downloadVtt(cues: Cue[], filename = 'subtitles.vtt') {
  const content = exportVtt(cues)
  const blob = new Blob([content], { type: 'text/vtt' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
