import {Request, Response, Router} from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import {transcribeVideo} from '../services/whisperService'

const router = Router()

// Fix #10: store uploads in a separate directory, not served by /static
const UPLOADS_DIR = path.join(__dirname, '../../storage/uploads')
fs.mkdirSync(UPLOADS_DIR, {recursive: true})

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname).toLowerCase()),
})

const upload = multer({storage, limits: {fileSize: 500 * 1024 * 1024}}) //500 MB

router.post('/transcribe', upload.single('video'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({error: 'No video file provided'})
        return
    }

    try {
        const cues = await transcribeVideo(req.file.path);
        res.json({cues});
    } catch (err) {
        console.error('Transcription error:', err)
        const msg = err instanceof Error ? err.message : String(err)
        const isUserError = msg.startsWith('Unsupported video format')
        res.status(isUserError ? 400 : 500).json({error: isUserError ? msg : 'Internal server error'})
    } finally {
        // Fix #11: log cleanup failures instead of silently ignoring them
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Upload cleanup failed:', err)
        })
    }
})

export default router
