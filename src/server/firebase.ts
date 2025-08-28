import admin from 'firebase-admin'
import { Storage } from '@google-cloud/storage'
import { ENV } from '@/config/env'

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
    // Use file path; admin SDK can read from env var GOOGLE_APPLICATION_CREDENTIALS
    // But we convert to JSON read explicitly for consistency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    const creds = require(ENV.GOOGLE_APPLICATION_CREDENTIALS)
    return creds
  }
  return null
}

export function getAdminApp() {
  if (app) return app
  const creds = resolveServiceAccount()
  if (!creds && (ENV.USE_DB && ENV.DB_KIND === 'realtimedb')) {
    throw new Error('Firebase credentials required for RTDB when USE_DB=true')
  }
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
  const creds = ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined
  const storage = creds ? new Storage({ credentials: creds, projectId: creds.project_id }) : new Storage()
  return storage.bucket(ENV.FIREBASE_STORAGE_BUCKET)
}
