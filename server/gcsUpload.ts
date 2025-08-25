// server/gcsUpload.ts
import { Storage } from '@google-cloud/storage'
import fs from 'fs/promises'
import path from 'node:path'

const SA_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET
if (!SA_JSON) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON missing')
if (!BUCKET) throw new Error('FIREBASE_STORAGE_BUCKET missing')

const creds = JSON.parse(SA_JSON)
const storage = new Storage({ credentials: creds, projectId: creds.project_id })
const bucket = storage.bucket(BUCKET)

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl',   // HLS playlist
  '.ts': 'video/mp2t',                        // HLS segments
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.srt': 'application/x-subrip',
  '.vtt': 'text/vtt',
  '.json': 'application/json',
  '.txt': 'text/plain',
}

export function publicUrl(objectPath: string) {
  const enc = encodeURIComponent(objectPath)
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${enc}?alt=media`
}

async function uploadOnce(objectPath: string, localPath: string, cacheSeconds = 3600) {
  const ext = path.extname(objectPath).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'
  await bucket.upload(localPath, {
    destination: objectPath,
    metadata: { cacheControl: `public, max-age=${cacheSeconds}`, contentType },
    resumable: false,
  })
  return publicUrl(objectPath)
}

/** Retries transient 5xx/429 errors; good for CI/worker spikes */
export async function uploadFileGCS(objectPath: string, localPath: string, cacheSeconds = 3600, attempts = 3) {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await uploadOnce(objectPath, localPath, cacheSeconds)
    } catch (e: any) {
      lastErr = e
      if (e?.code && ![429, 500, 502, 503, 504].includes(Number(e.code))) break
      await new Promise(r => setTimeout(r, 500 * 2 ** i))
    }
  }
  throw lastErr
}

/** Convenience: upload every file in a local dir to a remote prefix (e.g., HLS) */
export async function uploadDirGCS(localDir: string, remotePrefix: string, cacheSeconds = 3600) {
  const files = await fs.readdir(localDir)
  const out: Record<string, string> = {}
  for (const f of files) {
    const lp = path.join(localDir, f)
    const key = `${remotePrefix.replace(/\/+$/, '')}/${f}`
    out[f] = await uploadFileGCS(key, lp, cacheSeconds)
  }
  return out
}
