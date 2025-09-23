import { Storage } from '@google-cloud/storage'
import fs from 'fs/promises'
import path from 'node:path'
import { getStartupConfig } from '@/lib/startup'
import { logJSON } from '@/server/debug'
import { loadEnv } from '@/config/env'
import { SAFE_MODE } from '@/lib/safe'

let storage: Storage | null = null
let bucket: any = null

function getStorage() {
  if (SAFE_MODE) throw new Error('GCS disabled in SAFE_MODE')
  if (!storage) {
    try {
      const config = getStartupConfig()
      const creds = config.googleCredentials
      storage = new Storage({ credentials: creds, projectId: creds?.project_id })
      const ENV = loadEnv()
      const bucketName = ENV.FIREBASE_STORAGE_BUCKET || ''
      if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET missing')
      bucket = storage.bucket(bucketName)
    } catch (error) {
      console.error('Failed to initialize GCS storage:', error)
      throw new Error('GCS storage not available')
    }
  }
  return { storage, bucket }
}

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
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
  const ENV = loadEnv()
  const bucketName = ENV.FIREBASE_STORAGE_BUCKET || ''
  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET missing')
  const enc = encodeURIComponent(objectPath)
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${enc}?alt=media`
}

async function uploadOnce(objectPath: string, localPath: string, cacheSeconds = 3600): Promise<string> {
  const { bucket } = getStorage()
  const file = bucket.file(objectPath)
  await file.save(await fs.readFile(localPath), {
    metadata: {
      contentType: MIME[path.extname(objectPath).toLowerCase()] || 'application/octet-stream',
      cacheControl: `public, max-age=${cacheSeconds}`,
    },
  })
  return publicUrl(objectPath)
}

export async function uploadFileGCS(objectPath: string, localPath: string, cacheSeconds = 3600, attempts = 3) {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const url = await uploadOnce(objectPath, localPath, cacheSeconds)
      try {
        const r = await fetch(url, { method: 'GET' })
        if (!r.ok) throw new Error(`verify ${r.status}`)
        logJSON('upload', { stage: 'upload', object: objectPath, url })
      } catch (ve: any) {
        if (i < attempts - 1) { await new Promise(r => setTimeout(r, 500 * 2 ** i)); continue }
        throw ve
      }
      return url
    } catch (e: any) {
      lastErr = e
      if (e?.code && ![429, 500, 502, 503, 504].includes(Number(e.code))) break
      await new Promise(r => setTimeout(r, 500 * 2 ** i))
    }
  }
  throw lastErr
}

export async function uploadDirGCS(localDir: string, remotePrefix: string, cacheSeconds = 3600) {
  const files = await fs.readdir(localDir)
  const out: Record<string, string> = {}
  for (const f of files) {
    const lp = path.join(localDir, f)
    const key = `${remotePrefix.replace(/\/+$|\/+$|^\/+/g, '').replace(/\/+$/, '')}/${f}`
    out[f] = await uploadFileGCS(key, lp, cacheSeconds)
  }
  return out
}


