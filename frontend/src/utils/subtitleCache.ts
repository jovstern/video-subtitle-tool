import type { Cue } from '../types/subtitle'

const CACHE_KEY = 'nagish_subtitle_cache'
const MAX_ENTRIES = 20
const TTL_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
  cues: Cue[]
  cachedAt: number
}

type CacheMap = Record<string, CacheEntry>

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
    localStorage.removeItem(CACHE_KEY)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)) } catch { /* give up */ }
  }
}

export function getCachedCues(file: File): Cue[] | null {
  const map = readCache()
  const entry = map[getFileFingerprint(file)]
  if (!entry) return null
  if (Date.now() - entry.cachedAt > TTL_MS) return null
  return entry.cues
}

export function setCachedCues(file: File, cues: Cue[]) {
  const map = readCache()
  const key = getFileFingerprint(file)
  const keys = Object.keys(map)
  if (keys.length >= MAX_ENTRIES && !map[key]) {
    delete map[keys[0]]
  }
  map[key] = { cues, cachedAt: Date.now() }
  writeCache(map)
}
