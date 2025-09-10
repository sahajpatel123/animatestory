import { z } from 'zod'

// Define allowed DB kinds
const DbKindEnum = z.enum(['realtimedb', 'firestore', 'none'])

// Raw ENV with relaxed optional fields to avoid throws at import
const RawEnvSchema = z.object({
  // core
  NODE_ENV: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  PUBLIC_WEB_ORIGIN: z.string().optional(),

  // queue
  REDIS_URL: z.string().optional(),

  // media
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),

  // firebase storage
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_B64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(), // path
  HLS_PUBLIC_BASE: z.string().optional(),

  // providers (optional)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  STABILITY_API_KEY: z.string().optional(),
  STABLE_AUDIO_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  FREESOUND_API_KEY: z.string().optional(),

  // security/ops
  JWT_SECRET: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().optional(),
  PROJECT_SPEND_CAP_USD: z.coerce.number().optional(),
  QUEUE_DASH_USER: z.string().optional(),
  QUEUE_DASH_PASS: z.string().optional(),

  // DB toggles
  USE_DB: z.union([z.string(), z.boolean()]).optional(),
  DB_KIND: DbKindEnum.optional(),

  // Realtime DB
  FIREBASE_DATABASE_URL: z.string().optional(),

  // Deprecated Postgres (do not require)
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
})

export type EnvShape = z.infer<typeof RawEnvSchema> & {
  USE_DB: boolean
  DB_KIND: 'realtimedb' | 'firestore' | 'none'
  NODE_ENV?: string
  LOG_LEVEL?: string
  RATE_LIMIT_PER_MIN?: number
  PROJECT_SPEND_CAP_USD?: number
}

function loadRawEnv(): EnvShape {
  const sp = RawEnvSchema.safeParse(process.env)
  const base: any = sp.success ? sp.data : {}
  // Defaults applied here without throwing
  base.NODE_ENV = base.NODE_ENV ?? 'production'
  base.LOG_LEVEL = base.LOG_LEVEL ?? 'info'
  base.RATE_LIMIT_PER_MIN = base.RATE_LIMIT_PER_MIN ?? 20
  base.PROJECT_SPEND_CAP_USD = base.PROJECT_SPEND_CAP_USD ?? 5
  const rawUseDb = base.USE_DB
  base.USE_DB = typeof rawUseDb === 'string' ? rawUseDb.toLowerCase() !== 'false' : Boolean(rawUseDb ?? true)
  base.DB_KIND = (base.DB_KIND as any) ?? 'realtimedb'
  return base as EnvShape
}

export function loadEnv(): EnvShape { return loadRawEnv() }

export function validateRequiredEnv() {
  const missing: string[] = []

  // core
  const ENV = loadRawEnv()
  if (!ENV.PUBLIC_WEB_ORIGIN) missing.push('PUBLIC_WEB_ORIGIN')

  // queue
  if (!ENV.REDIS_URL) missing.push('REDIS_URL')

  // firebase storage
  if (!ENV.FIREBASE_STORAGE_BUCKET) missing.push('FIREBASE_STORAGE_BUCKET')
  const hasJson = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  const hasB64 = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS_B64)
  const hasPath = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS)
  if (!(hasJson || hasB64 || hasPath)) {
    missing.push('one of GOOGLE_APPLICATION_CREDENTIALS_JSON | GOOGLE_APPLICATION_CREDENTIALS_B64 | GOOGLE_APPLICATION_CREDENTIALS')
  }
  if (!ENV.HLS_PUBLIC_BASE) missing.push('HLS_PUBLIC_BASE')

  // security/ops
  if (!ENV.JWT_SECRET) missing.push('JWT_SECRET')
  if (!ENV.QUEUE_DASH_USER) missing.push('QUEUE_DASH_USER')
  if (!ENV.QUEUE_DASH_PASS) missing.push('QUEUE_DASH_PASS')

  // DB toggles
  if (ENV.USE_DB && ENV.DB_KIND === 'realtimedb') {
    if (!ENV.FIREBASE_DATABASE_URL) missing.push('FIREBASE_DATABASE_URL')
  }

  const warnings: string[] = []
  const providerKeys = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'STABILITY_API_KEY',
    'STABLE_AUDIO_API_KEY',
    'ELEVENLABS_API_KEY',
    'FREESOUND_API_KEY',
  ] as const
  for (const key of providerKeys) {
    if (!((process.env as any)[key])) warnings.push(`${key} missing (optional)`) 
  }

  return { ok: missing.length === 0, missing, warnings }
}
