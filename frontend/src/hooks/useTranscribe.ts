import { useMutation } from '@tanstack/react-query'
import { useSubtitleStore } from '../store/subtitleStore'
import { KEYFRAME_INTERVAL_SECONDS } from '../constants'
import { getCachedCues, setCachedCues } from '../utils/subtitleCache'

async function postForm(url: string, file: File, extra?: Record<string, string>) {
  const form = new FormData()
  form.append('video', file)
  if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v))
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function useTranscribe() {
  const { setTranscriptionStatus, setCues, setKeyframes } = useSubtitleStore()

  return useMutation({
    mutationFn: async (file: File) => {
      const cached = getCachedCues(file)
      if (cached) {
        setTranscriptionStatus('uploading')
        // Still need keyframes — upload only for that
        const keyframesRes = await postForm('/api/keyframes', file, { fps: String(KEYFRAME_INTERVAL_SECONDS) })
        return { cues: cached, keyframes: keyframesRes.keyframes, fromCache: true }
      }

      setTranscriptionStatus('uploading')
      const [transcribeRes, keyframesRes] = await Promise.all([
        postForm('/api/transcribe', file),
        postForm('/api/keyframes', file, { fps: String(KEYFRAME_INTERVAL_SECONDS) }),
      ])
      setCachedCues(file, transcribeRes.cues)
      return { cues: transcribeRes.cues, keyframes: keyframesRes.keyframes, fromCache: false }
    },
    onSuccess: ({ cues, keyframes, fromCache }) => {
      setCues(cues, fromCache)
      setKeyframes(keyframes)
      setTranscriptionStatus('done')
    },
    onError: (err) => setTranscriptionStatus('error', err instanceof Error ? err.message : String(err)),
  })
}
