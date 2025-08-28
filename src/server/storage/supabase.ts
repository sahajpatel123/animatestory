import { createClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export function getAdminClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const service = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, service, { auth: { persistSession: false } })
}

export function getPublicClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createClient(url, anon, { auth: { persistSession: false } })
}

export async function uploadBuffer(params: { bucket: string; path: string; data: Buffer; contentType: string; cacheControl?: string }) {
  const supa = getAdminClient()
  const { bucket, path, data, contentType, cacheControl } = params
  const { error } = await supa.storage.from(bucket).upload(path, data, { upsert: true, contentType, cacheControl: cacheControl ?? 'public, max-age=31536000, immutable' })
  if (error) throw error
  const { data: pub } = supa.storage.from(bucket).getPublicUrl(path)
  if (pub?.publicUrl) return pub.publicUrl
  const { data: signed, error: signErr } = await supa.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365)
  if (signErr) throw signErr
  return signed.signedUrl
}


