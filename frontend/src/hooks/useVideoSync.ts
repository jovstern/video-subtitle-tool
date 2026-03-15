import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useSubtitleStore } from '../store/subtitleStore'

export function useVideoSync(videoRef: RefObject<HTMLVideoElement | null>) {
  const { cues, selectCue, setVideoDuration } = useSubtitleStore()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onDurationChange = () => setVideoDuration(video.duration)
    const onTimeUpdate = () => {
      const t = video.currentTime
      const active = cues.find((c) => t >= c.startTime && t <= c.endTime)
      selectCue(active?.id ?? null)
    }

    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [videoRef, cues, selectCue, setVideoDuration])
}
