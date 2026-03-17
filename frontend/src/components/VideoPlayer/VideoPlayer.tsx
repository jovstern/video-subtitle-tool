import type {RefObject} from 'react'
import {useEffect} from 'react'
import {AlertCircle, Loader2} from 'lucide-react'
import {Badge, Text} from '@radix-ui/themes'
import {useSubtitleStore} from '../../store/subtitleStore'
import {useVideoSync} from '../../hooks/useVideoSync'

interface Props {
    videoRef: RefObject<HTMLVideoElement | null>
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoPlayer({videoRef}: Props) {
    const {videoObjectURL, videoFile, cues, selectedCueId, transcriptionStatus} =
        useSubtitleStore()

    useVideoSync(videoRef)

    useEffect(() => {
        if (videoObjectURL && videoRef.current) {
            videoRef.current.src = videoObjectURL
            videoRef.current.load()
        }
    }, [videoObjectURL, videoRef])

    const activeCue = cues.find((c) => c.id === selectedCueId)

    return (
        <div className="w-3/4 flex flex-col gap-2">

            {videoFile && (
                <div className="flex items-center gap-2">
                    <Text size="3" weight="bold" className="truncate">
                        {videoFile.name}
                    </Text>
                    <Badge color="gray" variant="soft" radius="full">
                        {formatFileSize(videoFile.size)}
                    </Badge>
                </div>
            )}


            <div className="relative rounded-lg overflow-hidden">
                <video ref={videoRef} controls playsInline className="w-full h-full bg-black"/>

                {activeCue && (
                    <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-black/75 text-white px-3 py-1 rounded text-base max-w-[80%] text-center leading-snug">
              {activeCue.text}
            </span>
                    </div>
                )}

                {(transcriptionStatus === 'uploading' || transcriptionStatus === 'processing') && (
                    <div
                        className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <Loader2 size={12} className="animate-spin"/>
                        {transcriptionStatus === 'uploading' ? 'Uploading…' : 'Generating captions with Gemini…'}
                    </div>
                )}
                {transcriptionStatus === 'error' && (
                    <div
                        className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-full">
                        <AlertCircle size={12}/>
                        Transcription failed
                    </div>
                )}
            </div>
        </div>
    )
}
