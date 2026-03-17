import {useCallback, useEffect, useRef, useState} from 'react'
import {useSubtitleStore} from '../../store/subtitleStore'
import {KeyframeStrip} from './KeyframeStrip'
import {CueBlock} from './CueBlock'
import styles from './Timeline.module.css'

interface Props {
    videoRef: React.RefObject<HTMLVideoElement | null>
}

export function Timeline({videoRef}: Props) {
    const {cues, videoDuration} = useSubtitleStore()
    const timelineRef = useRef<HTMLDivElement>(null)
    const [currentTime, setCurrentTime] = useState(0)
    useEffect(() => {
        const video = videoRef.current

        if (!video) return

        const onTimeUpdate = () => setCurrentTime(video.currentTime)
        video.addEventListener('timeupdate', onTimeUpdate)
        return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }, [videoRef])

    const onTimelineClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!timelineRef.current || !videoRef.current || videoDuration === 0) return

            const rect = timelineRef.current.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            videoRef.current.currentTime = ratio * videoDuration
        },
        [videoRef, videoDuration]
    )

    if (!videoDuration) return null

    const playheadPct = `${(currentTime / videoDuration) * 100}%`

    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-white">
            <KeyframeStrip/>

            <div className={styles.cueLayer} ref={timelineRef} onClick={onTimelineClick}>
                {cues.map((cue) => (
                    <CueBlock key={cue.id} cue={cue} duration={videoDuration} videoRef={videoRef}/>
                ))}
            </div>

            <div
                className="absolute top-0 bottom-0 w-px bg-white pointer-events-none z-10 "
                style={{left: playheadPct}}
            />
        </div>
    )
}
