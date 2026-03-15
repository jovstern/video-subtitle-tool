import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface Cue {
  id: string
  startTime: number
  endTime: number
  text: string
}

const PROMPT = `Transcribe the audio from this video into subtitle segments.
Return ONLY a valid JSON array with no markdown or explanation. Each item must have:
- "startTime": number (seconds, float)
- "endTime": number (seconds, float)
- "text": string (the spoken words)

Example: [{"startTime":0.0,"endTime":2.5,"text":"Hello world"}]`

export async function transcribeVideo(videoPath: string): Promise<Cue[]> {
  const mimeType = getMimeType(videoPath)
  const videoData = fs.readFileSync(videoPath)
  const base64 = videoData.toString('base64')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    PROMPT,
    { inlineData: { mimeType, data: base64 } },
  ])

  const raw = result.response.text().trim()

  // Strip markdown code fences if present
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  const segments: Array<{ startTime: number; endTime: number; text: string }> = JSON.parse(json)

  return segments.map((seg) => ({
    id: uuidv4(),
    startTime: seg.startTime,
    endTime: seg.endTime,
    text: seg.text.trim(),
  }))
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/mp4',
  }
  return map[ext] ?? 'video/mp4'
}
