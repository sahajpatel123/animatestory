// server/gcsUpload.ts
import { Storage } from '@google-cloud/storage'
import fs from 'fs/promises'
import path from 'node:path'
import { getStartupConfig } from '@/lib/startup'

let storage: Storage | null = null
let bucket: any = null

function getStorage() {
  if (!storage) {
    try {
      const config = getStartupConfig()
      const creds = config.googleCredentials
      storage = new Storage({ credentials: creds, projectId: creds.project_id })
      bucket = storage.bucket(config.firebaseBucket)
    } catch (error) {
      console.error('Failed to initialize GCS storage:', error)
      throw new Error('GCS storage not available')
    }
  }
  return { storage, bucket }
}

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

export function publicUrl(objectPath: string): string {
  try {
    const config = getStartupConfig()
    const enc = encodeURIComponent(objectPath)
    return `https://firebasestorage.googleapis.com/v0/b/${config.firebaseBucket}/o/${enc}?alt=media`
  } catch (error) {
    console.error('Failed to generate public URL:', error)
    throw new Error('Failed to generate public URL')
  }
}

async function uploadOnce(objectPath: string, localPath: string, cacheSeconds = 3600): Promise<string> {
  try {
    const { bucket } = getStorage()
    const file = bucket.file(objectPath)
    
    await file.save(await fs.readFile(localPath), {
      metadata: {
        contentType: MIME[path.extname(objectPath).toLowerCase()] || 'application/octet-stream',
        cacheControl: `public, max-age=${cacheSeconds}`,
      },
    })
    
    return publicUrl(objectPath)
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
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
