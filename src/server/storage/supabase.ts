import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getAdminClient() {
  if (!url || !service) throw new Error('Supabase admin env missing')
  return createClient(url, service, { auth: { persistSession: false } })
}

export function getPublicClient() {
  if (!url || !anon) throw new Error('Supabase public env missing')
  return createClient(url, anon, { auth: { persistSession: true } })
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


