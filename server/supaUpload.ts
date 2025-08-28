import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'node:path'
import { getStartupConfig } from '@/lib/startup'

function getSupabaseClient() {
  try {
    const config = getStartupConfig()
    return createClient(config.supabaseUrl, config.supabaseServiceKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw new Error('Supabase client not available')
  }
}

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
  try {
    const supa = getSupabaseClient()
    const { data, error } = await supa.storage.from(bucket).upload(key, await fs.readFile(localPath), {
      contentType: mime(localPath),
      cacheControl: `public, max-age=${cache}`,
      upsert: true,
    })
    
    if (error) throw error
    
    const { data: urlData } = supa.storage.from(bucket).getPublicUrl(key)
    return urlData.publicUrl
  } catch (error) {
    console.error('Supabase upload failed:', error)
    throw error
  }
}


