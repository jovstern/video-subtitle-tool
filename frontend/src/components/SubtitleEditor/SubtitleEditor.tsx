import {AlertCircle, Loader2, RotateCcw, Zap} from 'lucide-react'
import {Button, ScrollArea, Text} from '@radix-ui/themes'
import {useSubtitleStore} from '../../store/subtitleStore'
import {CueRow} from './CueRow'

export function SubtitleEditor() {
    const {cues, resetCues, originalCues, transcriptionStatus, transcriptionError, isFromCache} = useSubtitleStore()
    const isLoading = transcriptionStatus === 'uploading' || transcriptionStatus === 'processing'
    const isError = transcriptionStatus === 'error'
    const isDirty = JSON.stringify(cues) !== JSON.stringify(originalCues)

    if (!isLoading && !isError && cues.length === 0) return null

    return (
        <div
            className={`flex flex-col gap-2 w-1/3 h-auto ${isError ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Text size="3" weight="bold">Subtitles</Text>
                    {isFromCache && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                            <Zap size={10}/> Cached
                        </span>
                    )}
                </div>
                {originalCues.length > 0 && (
                    <Button size="1" variant="ghost" color="gray" onClick={resetCues} disabled={!isDirty}>
                        <RotateCcw size={12}/> Reset
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 rounded-lg border border-gray-200 relative overflow-y-auto px-2">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                        <Loader2 size={28} className="animate-spin text-indigo-500"/>
                    </div>
                )}
                {isError && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 gap-2 p-4">
                        <AlertCircle size={28} className="text-red-400 shrink-0"/>
                        <Text size="2" color="red" weight="bold">Transcription failed</Text>
                        {transcriptionError && (
                            <Text size="1" color="red" className="text-center break-all font-mono">
                                {transcriptionError}
                            </Text>
                        )}
                    </div>
                )}
                <table className="w-[99%] text-sm border-collapse">
                    <thead>
                    <tr className="bg-gray-50 sticky top-0 z-10">
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">End</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Text</th>
                        <th className="w-8"/>
                    </tr>
                    </thead>
                    <tbody>
                    {cues.map((cue) => (
                        <CueRow key={cue.id} cue={cue}/>
                    ))}
                    </tbody>
                </table>
            </ScrollArea>
        </div>
    )
}
