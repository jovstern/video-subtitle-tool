import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Film } from 'lucide-react'
import { Text } from '@radix-ui/themes'
import { useSubtitleStore } from '../../store/subtitleStore'
import { useTranscribe } from '../../hooks/useTranscribe'

export function DropZone() {
  const { setVideo } = useSubtitleStore()
  const { mutate, isPending } = useTranscribe()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      setVideo(file)
      mutate(file)
    },
    [setVideo, mutate]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: false,
    disabled: isPending,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        w-[700px] h-[500px] flex flex-col items-center justify-center gap-4
        border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'}
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Film size={48} className="text-indigo-400" strokeWidth={1.5} />
      <div className="text-center">
        <Text size="3" weight="medium" className="block">
          {isDragActive ? 'Drop your video here…' : 'Drag & drop a video, or click to browse'}
        </Text>
        <Text size="2" color="gray" className="block mt-1">
          MP4, MOV, WebM, AVI supported
        </Text>
        <Text size="1" color="amber" className="block mt-3">
          Best with short videos (&lt;2 min) — Gemini free tier limits apply
        </Text>
      </div>
    </div>
  )
}
