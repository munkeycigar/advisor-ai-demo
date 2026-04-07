import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Generate endpoint — shells out to Claude CLI
// The prompt is piped via stdin (not as a CLI argument) to avoid
// OS argument-length limits and special-character escaping issues.
app.post('/api/generate', (req, res) => {
  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  console.log(`[generate] Received prompt (${prompt.length} chars), calling Claude CLI...`)

  const child = spawn('claude', ['-p', '--output-format', 'text'], {
    env: { ...process.env },
  })

  let stdout = ''
  let stderr = ''

  child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })

  // Pipe the prompt into stdin, then close it so Claude knows we're done
  child.stdin.write(prompt)
  child.stdin.end()

  // Safety timeout — kill the process after 2 minutes
  const timeout = setTimeout(() => {
    child.kill('SIGTERM')
    if (!res.headersSent) {
      res.status(504).json({ error: 'Claude CLI timed out after 2 minutes' })
    }
  }, 120_000)

  child.on('close', (code) => {
    clearTimeout(timeout)
    if (res.headersSent) return // timeout already responded

    if (code !== 0) {
      console.error(`[generate] Claude CLI exited with code ${code}`)
      if (stderr) console.error('[generate] stderr:', stderr)
      return res.status(500).json({
        error: `Claude CLI error (exit ${code}): ${stderr || 'Unknown error'}`,
      })
    }

    console.log(`[generate] Response received (${stdout.length} chars)`)
    res.json({ response: stdout.trim() })
  })

  child.on('error', (err) => {
    clearTimeout(timeout)
    console.error('[generate] Failed to spawn Claude CLI:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to start Claude CLI: ${err.message}` })
    }
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`)
})
