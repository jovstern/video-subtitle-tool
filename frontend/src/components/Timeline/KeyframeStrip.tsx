import { useSubtitleStore } from '../../store/subtitleStore'

export function KeyframeStrip() {
  const keyframes = useSubtitleStore((s) => s.keyframes)

  if (keyframes.length === 0) {
    return <div className="h-14 bg-gray-900" />
  }

  return (
    <div className="flex h-14 overflow-x-auto overflow-y-hidden bg-gray-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {keyframes.map((url, i) => (
        <img key={i} src={url} alt={`frame ${i}`} className="h-14 flex-shrink-0 object-cover opacity-85" draggable={false} />
      ))}
    </div>
  )
}
