import type admin from 'firebase-admin'
import type { Storage } from '@google-cloud/storage'
import { loadEnv } from '@/config/env'
import { SAFE_MODE } from '@/lib/safe'

let app: any = null

function tryParseJson(s?: string | null) {
  try { return s ? JSON.parse(s) : null } catch { return null }
}

export async function getAdminApp() {
  if (SAFE_MODE) throw new Error('Firebase disabled in SAFE_MODE')
  if (app) return app
  const { initializeApp, credential } = await import('firebase-admin')
  const ENV = loadEnv()
  const credsJson = tryParseJson(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON || '')
  const credsB64 = tryParseJson(ENV.GOOGLE_APPLICATION_CREDENTIALS_B64 ? Buffer.from(ENV.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString('utf8') : '')
  const credsPath = ENV.GOOGLE_APPLICATION_CREDENTIALS ? require(ENV.GOOGLE_APPLICATION_CREDENTIALS) : null
  const creds = credsJson || credsB64 || credsPath || null
  app = initializeApp({
    credential: creds ? (credential as any).cert(creds) : (credential as any).applicationDefault(),
    databaseURL: ENV.FIREBASE_DATABASE_URL,
  })
  return app
}

export async function getRtdb() {
  const ENV = loadEnv()
  if (!(ENV.USE_DB && ENV.DB_KIND === 'realtimedb')) return null
  const app = await getAdminApp()
  return (app as any).database()
}

export async function getBucket() {
  if (SAFE_MODE) throw new Error('Storage disabled in SAFE_MODE')
  const ENV = loadEnv()
  const { Storage } = await import('@google-cloud/storage')
  const creds = tryParseJson(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON || '') || undefined
  const storage: InstanceType<typeof Storage> = creds ? new (Storage as any)({ credentials: creds, projectId: (creds as any).project_id }) : new (Storage as any)()
  const name = ENV.FIREBASE_STORAGE_BUCKET || ''
  if (!name) throw new Error('FIREBASE_STORAGE_BUCKET missing')
  return (storage as any).bucket(name)
}
