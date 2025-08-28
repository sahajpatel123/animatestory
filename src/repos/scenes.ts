import { getRtdb } from '@/server/firebase'
import { Scene, SceneSchema } from '@/types/models'

const base = (projectId: string) => `/projects/${projectId}/scenes`

export async function listScenes(projectId: string): Promise<Scene[]> {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const snap = await db.ref(base(projectId)).get()
  if (!snap.exists()) return []
  const val = snap.val() || {}
  const scenes: Scene[] = Object.values(val)
  return scenes.map((s: any) => SceneSchema.parse(s))
}

export async function getScene(projectId: string, sceneId: string): Promise<Scene | null> {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const snap = await db.ref(`${base(projectId)}/${sceneId}`).get()
  if (!snap.exists()) return null
  return SceneSchema.parse(snap.val())
}

export async function upsertScene(projectId: string, sceneId: string, data: Scene): Promise<Scene> {
  const db = getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const parsed = SceneSchema.parse(data)
  await db.ref(`${base(projectId)}/${sceneId}`).set(parsed)
  return parsed
}
