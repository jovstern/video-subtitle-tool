import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import fs from 'fs'
import {v4 as uuidv4} from 'uuid'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// clean up keyframe directories older than this threshold
const KEYFRAME_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function extractKeyframes(
    videoPath: string,
    storageDir: string,
    fps = 1
): Promise<string[]> {
    const jobId = uuidv4()
    const outDir = path.join(storageDir, 'keyframes', jobId)
    fs.mkdirSync(outDir, {recursive: true})

    await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([`-vf fps=${fps}`, '-qscale:v 2'])
            .output(path.join(outDir, 'frame_%04d.jpg'))
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(err))
            .run()
    })

    const files = fs
        .readdirSync(outDir)
        .filter((f) => f.endsWith('.jpg'))
        .sort()
  
    setTimeout(() => cleanupDir(outDir), KEYFRAME_TTL_MS)

    return files.map((f) => `/static/keyframes/${jobId}/${f}`)
}

function cleanupDir(dirPath: string): void {
    fs.rm(dirPath, {recursive: true, force: true}, (err) => {
        if (err) console.error(`Keyframe cleanup failed for ${dirPath}:`, err)
    })
}
