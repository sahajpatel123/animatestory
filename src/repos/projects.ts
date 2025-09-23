import { getRtdb } from '@/server/firebase'
import { Project, ProjectSchema } from '@/types/models'

const pathFor = (id: string) => `/projects/${id}`

export async function getProject(id: string): Promise<Project | null> {
  const db = await getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const snap = await db.ref(pathFor(id)).get()
  if (!snap.exists()) return null
  const val = snap.val()
  const parsed = ProjectSchema.safeParse(val)
  if (!parsed.success) return null
  return parsed.data
}

export async function upsertProject(data: Project): Promise<Project> {
  const db = await getRtdb()
  if (!db) throw Object.assign(new Error('DB disabled'), { status: 501 })
  const parsed = ProjectSchema.parse(data)
  await db.ref(pathFor(parsed.id)).set({ ...parsed, updatedAt: new Date().toISOString(), createdAt: parsed.createdAt ?? new Date().toISOString() })
  return parsed
}
