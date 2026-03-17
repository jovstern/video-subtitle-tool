import {useEffect, useRef} from 'react'
import {Trash2} from 'lucide-react'
import {IconButton} from '@radix-ui/themes'
import type {Cue} from '../../types/subtitle'
import {useSubtitleStore} from '../../store/subtitleStore'

interface Props {
    cue: Cue
}

export function CueRow({cue}: Props) {
    const {updateCue, deleteCue, selectCue, selectedCueId} = useSubtitleStore()
    const isSelected = selectedCueId === cue.id
    const rowRef = useRef<HTMLTableRowElement>(null)

    useEffect(() => {
        if (isSelected) rowRef.current?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
    }, [isSelected])

    const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
        const num = parseFloat(value)
        if (!isNaN(num)) updateCue(cue.id, {[field]: num})
    }

    return (
        <tr
            ref={rowRef}
            onClick={() => selectCue(cue.id)}
            className={`border-b border-gray-200 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}
        >
            <td className="px-1 py-1.5">
                <input
                    type="number"
                    className="w-16 px-1.5 py-1 text-xs font-mono border border-gray-200 rounded bg-white focus:outline-none focus:border-indigo-400"
                    value={cue.startTime.toFixed(2)}
                    step="0.1"
                    min="0"
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            <td className="px-1 py-1.5">
                <input
                    type="number"
                    className="w-16 px-1.5 py-1 text-xs font-mono border border-gray-200 rounded bg-white focus:outline-none focus:border-indigo-400"
                    value={cue.endTime.toFixed(2)}
                    step="0.1"
                    min="0"
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            <td className="px-1 py-1.5">
              <textarea
                  className="w-full min-w-[200px] px-1.5 py-1 text-sm border border-gray-200 rounded bg-white resize-y focus:outline-none focus:border-indigo-400 font-sans"
                  value={cue.text}
                  rows={2}
                  onChange={(e) => updateCue(cue.id, {text: e.target.value})}
                  onClick={(e) => e.stopPropagation()}
              />
            </td>
            <td className="px-1 py-1.5">
                <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteCue(cue.id)
                    }}
                >
                    <Trash2 size={13}/>
                </IconButton>
            </td>
        </tr>
    )
}
