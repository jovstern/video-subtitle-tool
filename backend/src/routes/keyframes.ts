import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { extractKeyframes } from '../services/keyframeService'

const router = Router()
const STORAGE = path.join(__dirname, '../../storage')

const storage = multer.diskStorage({
  destination: STORAGE,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

router.post('/keyframes', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' })
    return
  }

  try {
    const keyframes = await extractKeyframes(req.file.path, STORAGE)
    res.json({ keyframes })
  } catch (err) {
    console.error('Keyframe error:', err)
    res.status(500).json({ error: String(err) })
  } finally {
    fs.unlink(req.file.path, () => {})
  }
})

export default router
