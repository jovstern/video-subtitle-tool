import {GoogleGenerativeAI} from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import {v4 as uuidv4} from 'uuid'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('GEMINI_API_KEY env var is required')

const genAI = new GoogleGenerativeAI(apiKey)

// Fix #17: hoist model to module scope — no need to re-instantiate per request
const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'})

export interface Cue {
    id: string
    startTime: number
    endTime: number
    text: string
}

const SUPPORTED_MIME: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/mp4',
}

const PROMPT = `Transcribe the audio from this video into subtitle segments.
Detect the spoken language and transcribe in that same language — do not translate.
Return ONLY a valid JSON array with no markdown or explanation. Each item must have:
- "startTime": number (seconds, float)
- "endTime": number (seconds, float)
- "text": string (the spoken words)

Example: [{"startTime":0.0,"endTime":2.5,"text":"Hello world"}]`

export async function transcribeVideo(videoPath: string): Promise<Cue[]> {
    const mimeType = getMimeType(videoPath)

    const videoData = await fs.promises.readFile(videoPath)
    const base64 = videoData.toString('base64')

    const result = await model.generateContent([
        PROMPT,
        {inlineData: {mimeType, data: base64}},
    ])

    const raw = result.response.text().trim()

    const segments = parseGeminiResponse(raw)

    return segments.map((seg) => ({
        id: uuidv4(),
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text?.trim() ?? '',
    }))
}

function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const mime = SUPPORTED_MIME[ext]
    // Fix #13: throw on unsupported extension instead of silent fallback
    if (!mime) throw new Error(`Unsupported video format: ${ext}`)
    return mime
}

function parseGeminiResponse(raw: string): Array<{ startTime: number; endTime: number; text: string }> {
    // Strip markdown code fences (handles variations like ```json, ``` json, etc.)
    const json = raw.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim()

    let parsed: unknown
    try {
        parsed = JSON.parse(json)
    } catch {
        throw new Error(`Gemini returned invalid JSON: ${json.slice(0, 200)}`)
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Gemini response was not a JSON array')
    }

    return parsed as Array<{ startTime: number; endTime: number; text: string }>
}
