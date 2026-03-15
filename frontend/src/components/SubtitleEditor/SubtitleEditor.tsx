import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import { ScrollArea, Text } from '@radix-ui/themes'
import { useSubtitleStore } from '../../store/subtitleStore'
import { CueRow } from './CueRow'

export function SubtitleEditor() {
  const { cues, reorderCues, transcriptionStatus } = useSubtitleStore()
  const isLoading = transcriptionStatus === 'uploading' || transcriptionStatus === 'processing'

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = cues.findIndex((c) => c.id === active.id)
    const toIndex = cues.findIndex((c) => c.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) reorderCues(fromIndex, toIndex)
  }

  if (!isLoading && cues.length === 0) return null

  return (
    <div className="flex flex-col gap-2 w-1/3 h-full ">
      <Text size="3" weight="bold">Subtitles</Text>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ScrollArea className="flex-1 rounded-lg border border-gray-200 relative overflow-y-auto px-2">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
          )}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 sticky top-0 z-10">
                <th className="w-6 px-2 py-2" />
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">End</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Text</th>
                <th className="w-8" />
              </tr>
            </thead>
            <SortableContext items={cues.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {cues.map((cue) => (
                  <CueRow key={cue.id} cue={cue} />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </ScrollArea>
      </DndContext>
    </div>
  )
}
