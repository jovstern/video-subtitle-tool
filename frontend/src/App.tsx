import { useRef } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button, Text } from '@radix-ui/themes'
import { useSubtitleStore } from './store/subtitleStore'
import { DropZone } from './components/DropZone/DropZone'
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer'
import { Timeline } from './components/Timeline/Timeline'
import { SubtitleEditor } from './components/SubtitleEditor/SubtitleEditor'
import { ExportButton } from './components/ExportButton/ExportButton'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { videoObjectURL, reset } = useSubtitleStore()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <Text size="5" weight="bold" className="text-indigo-600">Nagish</Text>
        <div className="flex items-center gap-2">
          {videoObjectURL && (
            <Button variant="soft" size="2" onClick={reset}>
              <FolderOpen size={15} />
              Load different video
            </Button>
          )}
          <ExportButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex justify-center mt-8">
        {!videoObjectURL ? (
          <DropZone />
        ) : (
          <div className="w-3/4 flex flex-col gap-4">

            <div className="flex gap-6 max-h-[650px] ">
              <VideoPlayer videoRef={videoRef} />
              <SubtitleEditor />
            </div>

            <Timeline videoRef={videoRef} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
