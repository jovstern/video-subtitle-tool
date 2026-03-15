import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import transcriptionRouter from './routes/transcription'
import keyframesRouter from './routes/keyframes'

const app = express()
const PORT = process.env.PORT ?? 8000
const STORAGE = path.join(__dirname, '../storage')

fs.mkdirSync(STORAGE, { recursive: true })

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api', transcriptionRouter)
app.use('/api', keyframesRouter)
app.use('/static', express.static(STORAGE))

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
