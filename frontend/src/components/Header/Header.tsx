import {ArrowLeft, Download} from 'lucide-react'
import {Button, Flex, Text} from '@radix-ui/themes'
import {useSubtitleStore} from '../../store/subtitleStore'
import {downloadVtt} from '../../utils/vttExport'

export function Header() {
    const {videoObjectURL, cues, videoFile, reset} = useSubtitleStore()
    const noVideo = !videoObjectURL
    const disabled = cues.length === 0

    const handleExport = () => {
        const name = videoFile ? videoFile.name.replace(/\.[^.]+$/, '.vtt') : 'subtitles.vtt'
        downloadVtt(cues, name)
    }

    return (
        <header
            className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <Text size="5" weight="bold" className="text-indigo-600">Nagish</Text>
            <Flex gap="4">
                <Button variant="soft" size="2" onClick={reset} disabled={noVideo}>
                    <ArrowLeft size={15}/>
                    Load different video
                </Button>

                <Button onClick={handleExport} variant="solid" size="2" disabled={disabled}>
                    <Download size={15}/>
                    Export .vtt
                </Button>
            </Flex>
        </header>
    )
}
