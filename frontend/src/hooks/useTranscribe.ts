import { useMutation } from '@tanstack/react-query'
import { useSubtitleStore } from '../store/subtitleStore'

async function postForm(url: string, file: File) {
  const form = new FormData()
  form.append('video', file)
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function useTranscribe() {
  const { setTranscriptionStatus, setCues, setKeyframes } = useSubtitleStore()

  return useMutation({
    mutationFn: async (file: File) => {
      setTranscriptionStatus('uploading')
      const [transcribeRes, keyframesRes] = await Promise.all([
        postForm('/api/transcribe', file),
        postForm('/api/keyframes', file),
      ])
      return { cues: transcribeRes.cues, keyframes: keyframesRes.keyframes }
    },
    onSuccess: ({ cues, keyframes }) => {
      setCues(cues)
      setKeyframes(keyframes)
      setTranscriptionStatus('done')
    },
    onError: () => setTranscriptionStatus('error'),
  })
}
