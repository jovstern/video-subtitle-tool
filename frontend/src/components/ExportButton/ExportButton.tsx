import { Download } from 'lucide-react'
import { Button } from '@radix-ui/themes'
import { useSubtitleStore } from '../../store/subtitleStore'
import { downloadVtt } from '../../utils/vttExport'

export function ExportButton() {
  const { cues, videoFile } = useSubtitleStore()
  const disabled = cues.length === 0

  const handleExport = () => {
    const name = videoFile ? videoFile.name.replace(/\.[^.]+$/, '.vtt') : 'subtitles.vtt'
    downloadVtt(cues, name)
  }

  return (
    <Button onClick={handleExport} variant="solid" size="2" disabled={disabled}>
      <Download size={15} />
      Export .vtt
    </Button>
  )
}
