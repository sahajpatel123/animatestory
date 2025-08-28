import { createClient } from '@supabase/supabase-js'
import { getStartupConfig } from '@/lib/startup'

export function getAdminClient() {
  try {
    const config = getStartupConfig()
    return createClient(config.supabaseUrl, config.supabaseServiceKey, { 
      auth: { persistSession: false } 
    })
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error)
    throw new Error('Supabase admin client not available')
  }
}

export function getPublicClient() {
  try {
    const config = getStartupConfig()
    return createClient(config.supabaseUrl, config.supabaseAnonKey, { 
      auth: { persistSession: false } 
    })
  } catch (error) {
    console.error('Failed to create Supabase public client:', error)
    throw new Error('Supabase public client not available')
  }
}

export async function uploadBuffer(params: { bucket: string; path: string; data: Buffer; contentType: string; cacheControl?: string }) {
  const supa = getAdminClient()
  const { bucket, path, data, contentType, cacheControl } = params
  const { error } = await supa.storage.from(bucket).upload(path, data, { upsert: true, contentType, cacheControl: cacheControl ?? 'public, max-age=31536000, immutable' })
  if (error) throw error
  // Try public URL; otherwise fallback to signed URL
  const { data: pub } = supa.storage.from(bucket).getPublicUrl(path)
  if (pub?.publicUrl) return pub.publicUrl
  const { data: signed, error: signErr } = await supa.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365)
  if (signErr) throw signErr
  return signed.signedUrl
}


