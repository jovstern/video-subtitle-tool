import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { transcribeVideo } from '../services/whisperService'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../storage'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

router.post('/transcribe', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' })
    return
  }

  try {
    const cues = await transcribeVideo(req.file.path)
    res.json({ cues })
  } catch (err) {
    console.error('Transcription error:', err)
    res.status(500).json({ error: String(err) })
  } finally {
    fs.unlink(req.file.path, () => {})
  }
})

export default router
