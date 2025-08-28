import admin from 'firebase-admin'
import { Storage } from '@google-cloud/storage'
import { ENV } from '@/config/env'
import { SAFE_MODE } from '@/lib/safe'

let app: admin.app.App | null = null

function resolveServiceAccount(): any {
  if (ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return JSON.parse(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  }
  if (ENV.GOOGLE_APPLICATION_CREDENTIALS_B64) {
    const json = Buffer.from(ENV.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString('utf8')
    return JSON.parse(json)
  }
  if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const creds = require(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    return creds
  }
  return null
}

export function getAdminApp() {
  if (SAFE_MODE) throw new Error('Firebase disabled in SAFE_MODE')
  if (app) return app
  const creds = resolveServiceAccount()
  app = admin.initializeApp({
    credential: creds ? admin.credential.cert(creds) : admin.credential.applicationDefault(),
    databaseURL: ENV.FIREBASE_DATABASE_URL,
  })
  return app
}

export function getRtdb() {
  if (!(ENV.USE_DB && ENV.DB_KIND === 'realtimedb')) return null
  return getAdminApp().database()
}

export function getBucket() {
  if (SAFE_MODE) throw new Error('Storage disabled in SAFE_MODE')
  const creds = ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined
  const storage = creds ? new Storage({ credentials: creds, projectId: creds.project_id }) : new Storage()
  const name = ENV.FIREBASE_STORAGE_BUCKET || ''
  if (!name) throw new Error('FIREBASE_STORAGE_BUCKET missing')
  return storage.bucket(name)
}
