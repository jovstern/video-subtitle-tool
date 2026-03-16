import {useRef} from 'react'
import {useSubtitleStore} from './store/subtitleStore'
import {DropZone} from './components/DropZone/DropZone'
import {VideoPlayer} from './components/VideoPlayer/VideoPlayer'
import {Timeline} from './components/Timeline/Timeline'
import {SubtitleEditor} from './components/SubtitleEditor/SubtitleEditor'
import {Header} from "./components/Header/Header.tsx";

function App() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const {videoObjectURL} = useSubtitleStore()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header/>

            <main className="flex-1 flex justify-center mt-8">
                {!videoObjectURL && <DropZone/>}
                
                {videoObjectURL && (
                    <div className="w-3/4 flex flex-col gap-4">
                        <div className="flex gap-6 max-h-[650px]">
                            <VideoPlayer videoRef={videoRef}/>
                            <SubtitleEditor/>
                        </div>
                        <Timeline videoRef={videoRef}/>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
