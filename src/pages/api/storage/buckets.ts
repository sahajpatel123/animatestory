import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !service) return res.status(500).json({ ok: false, error: 'Supabase env missing' })
    const supa = createClient(url, service, { auth: { persistSession: false } })
    const { data, error } = await supa.storage.listBuckets()
    if (error) return res.status(500).json({ ok: false, error: error.message })
    const names = (data || []).map(b => b.name)
    const exists = {
      assets: names.includes('assets'),
      renders: names.includes('renders'),
      hls: names.includes('hls'),
    }
    return res.status(200).json({ ok: true, buckets: names, exists })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message })
  }
}


