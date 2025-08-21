import { spawn } from 'node:child_process'

export function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: true })
    let stderr = ''
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} failed (${code})\n${stderr}`))
    })
  })
}

export async function ensureTools() {
  // allow ffmpeg-static/ffprobe-static via env overrides
  if (process.env.FFMPEG_PATH) process.env.PATH = `${process.env.FFMPEG_PATH}:${process.env.PATH}`
  if (process.env.FFPROBE_PATH) process.env.PATH = `${process.env.FFPROBE_PATH}:${process.env.PATH}`
}


