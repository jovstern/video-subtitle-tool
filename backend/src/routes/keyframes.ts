import {Request, Response, Router} from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import {extractKeyframes} from '../services/keyframeService'

const router = Router()

const STORAGE = path.join(__dirname, '../../storage')

const UPLOADS_DIR = path.join(STORAGE, 'uploads')
fs.mkdirSync(UPLOADS_DIR, {recursive: true})

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname).toLowerCase()),
})

const upload = multer({storage, limits: {fileSize: 500 * 1024 * 1024}}) // 500 MB

router.post('/keyframes', upload.single('video'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({error: 'No video file provided'})
        return
    }

    try {
        const rawFps = req.query.fps ?? req.body.fps
        const parsedFps = rawFps !== undefined ? Number(rawFps) : 1

        if (!Number.isFinite(parsedFps) || parsedFps <= 0) {
            res.status(400).json({error: 'fps must be a positive finite number'})
            return
        }
        const fps = Math.min(parsedFps, 30) // cap at 30 fps

        const keyframes = await extractKeyframes(req.file.path, STORAGE, fps)
        res.json({keyframes})
    } catch (err) {
        console.error('Keyframe error:', err)
        res.status(500).json({error: 'Internal server error'})
    } finally {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Upload cleanup failed:', err)
        })
    }
})

export default router
