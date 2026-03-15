import { useRef } from 'react'
import type { Cue } from '../../types/subtitle'
import { useSubtitleStore } from '../../store/subtitleStore'
import styles from './Timeline.module.css'

interface Props {
  cue: Cue
  duration: number
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function CueBlock({ cue, duration, videoRef }: Props) {
  const { selectedCueId, selectCue, updateCue } = useSubtitleStore()
  const isSelected = selectedCueId === cue.id
  const dragStart = useRef<{ x: number; startTime: number; endTime: number } | null>(null)

  const left = `${(cue.startTime / duration) * 100}%`
  const width = `${Math.max(0.5, ((cue.endTime - cue.startTime) / duration) * 100)}%`

  const onClick = () => {
    selectCue(cue.id)
    if (videoRef.current) videoRef.current.currentTime = cue.startTime
  }

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    dragStart.current = { x: e.clientX, startTime: cue.startTime, endTime: cue.endTime }
    const parentWidth = (e.currentTarget.parentElement?.offsetWidth ?? 1)

    const onMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return
      const dx = me.clientX - dragStart.current.x
      const dt = (dx / parentWidth) * duration
      const newStart = Math.max(0, dragStart.current.startTime + dt)
      const newEnd = Math.min(duration, dragStart.current.endTime + dt)
      if (newEnd > newStart) updateCue(cue.id, { startTime: newStart, endTime: newEnd })
    }

    const onMouseUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      className={`${styles.cueBlock} ${isSelected ? styles.selected : ''}`}
      style={{ left, width }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={cue.text}
    />
  )
}
