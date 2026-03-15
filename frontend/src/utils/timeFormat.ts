/** Converts seconds (float) to VTT timestamp: HH:MM:SS.mmm */
export function secondsToVtt(s: number): string {
  const ms = Math.round(s * 1000)
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  const millis = ms % 1000
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(millis)}`
}

/** Converts VTT timestamp to seconds */
export function vttToSeconds(ts: string): number {
  const parts = ts.split(':')
  if (parts.length === 3) {
    const [h, m, s] = parts
    return Number(h) * 3600 + Number(m) * 60 + parseFloat(s)
  }
  const [m, s] = parts
  return Number(m) * 60 + parseFloat(s)
}

/** Display format: MM:SS.s (no hours unless needed) */
export function formatDisplay(s: number): string {
  const total = Math.max(0, s)
  const minutes = Math.floor(total / 60)
  const seconds = (total % 60).toFixed(1)
  return `${pad2(minutes)}:${seconds.padStart(4, '0')}`
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function pad3(n: number) { return String(n).padStart(3, '0') }
