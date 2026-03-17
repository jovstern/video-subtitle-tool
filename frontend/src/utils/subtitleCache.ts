import type { Cue } from '../types/subtitle'

const CACHE_KEY = 'nagish_subtitle_cache'
const MAX_ENTRIES = 20

type CacheMap = Record<string, Cue[]>

export function getFileFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
}

function readCache(): CacheMap {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeCache(map: CacheMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    // localStorage full — clear and retry once
    localStorage.removeItem(CACHE_KEY)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)) } catch { /* give up */ }
  }
}

export function getCachedCues(file: File): Cue[] | null {
  const map = readCache()
  return map[getFileFingerprint(file)] ?? null
}

export function setCachedCues(file: File, cues: Cue[]) {
  const map = readCache()
  const key = getFileFingerprint(file)
  // Remove oldest entries if at cap (keep most recent MAX_ENTRIES - 1, add new one)
  const keys = Object.keys(map)
  if (keys.length >= MAX_ENTRIES && !map[key]) {
    delete map[keys[0]]
  }
  map[key] = cues
  writeCache(map)
}
