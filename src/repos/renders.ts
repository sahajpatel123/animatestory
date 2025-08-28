import { getRtdb } from '@/server/firebase'

export type RenderStore = {
  projectId: string
  url: string
  hlsUrl?: string | null
  manifestUrl?: string | null
  checksums?: Record<string, string>
  createdAt?: string
}

export async function storeRenderRecord(rec: RenderStore) {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const createdAt = new Date().toISOString()
  await db.ref(`/renders/${rec.projectId}`).set({ ...rec, createdAt })
}

export async function storeManifest(projectId: string, manifest: any) {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  await db.ref(`/manifests/${projectId}/render_manifest.json`).set({ ...manifest, createdAt: new Date().toISOString() })
}

export async function getLatestRender(projectId: string) {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const snap = await db.ref(`/renders/${projectId}`).get()
  return snap.exists() ? snap.val() : null
}
