import 'dotenv/config'
import express, {NextFunction, Request, Response} from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import transcriptionRouter from './routes/transcription'
import keyframesRouter from './routes/keyframes'

const app = express()
const PORT = process.env.PORT ?? 8000
const STORAGE = path.join(__dirname, '../storage')
const API_KEY = process.env.API_KEY

fs.mkdirSync(STORAGE, {recursive: true})

app.use(cors({origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173'}))
app.use(express.json({limit: '10kb'}))

app.get('/health', (_req, res) => res.json({status: 'ok'}))


if (API_KEY) {
    app.use('/api', (req: Request, res: Response, next: NextFunction) => {
        const auth = req.headers.authorization;

        if (auth !== `Bearer ${API_KEY}`) {
            res.status(401).json({error: 'Unauthorized'})
            return
        }
        next()
    })
}

app.use('/api', transcriptionRouter)
app.use('/api', keyframesRouter)

app.use('/static/keyframes', express.static(path.join(STORAGE, 'keyframes')))

const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
})

function shutdown(signal: string) {
    console.log(`${signal} received — shutting down`)
    server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
