import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'node:path'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const mime = (p: string) => ({
  '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain',
}[path.extname(p).toLowerCase()] || 'application/octet-stream')

export async function uploadFile(bucket: 'assets'|'renders'|'hls', key: string, localPath: string, cache = 3600) {
  const buf = await fs.readFile(localPath)
  const { error } = await supa.storage.from(bucket).upload(key, buf, { upsert: true, contentType: mime(localPath), cacheControl: String(cache) })
  if (error) throw error
  const { data } = supa.storage.from(bucket).getPublicUrl(key)
  return data.publicUrl
}


