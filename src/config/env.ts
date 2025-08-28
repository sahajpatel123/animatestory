import { z } from 'zod'

// Define allowed DB kinds
const DbKindEnum = z.enum(['realtimedb', 'firestore', 'none'])

// Raw ENV with defaults
const RawEnvSchema = z.object({
  // core
  NODE_ENV: z.string().default('production'),
  LOG_LEVEL: z.string().default('info'),
  PUBLIC_WEB_ORIGIN: z.string(),

  // queue
  REDIS_URL: z.string(),

  // media
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),

  // firebase storage
  FIREBASE_STORAGE_BUCKET: z.string(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_B64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(), // path
  HLS_PUBLIC_BASE: z.string(),

  // providers (optional)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  STABILITY_API_KEY: z.string().optional(),
  STABLE_AUDIO_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  FREESOUND_API_KEY: z.string().optional(),

  // security/ops
  JWT_SECRET: z.string(),
  RATE_LIMIT_PER_MIN: z.coerce.number().default(20),
  PROJECT_SPEND_CAP_USD: z.coerce.number().default(5),
  QUEUE_DASH_USER: z.string(),
  QUEUE_DASH_PASS: z.string(),

  // DB toggles
  USE_DB: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform((v) => (typeof v === 'string' ? v.toLowerCase() !== 'false' : Boolean(v))) as z.ZodType<boolean>,
  DB_KIND: DbKindEnum.default('realtimedb'),

  // Realtime DB
  FIREBASE_DATABASE_URL: z.string().optional(),

  // Deprecated Postgres (do not require)
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
})

export type EnvShape = z.infer<typeof RawEnvSchema>

function loadRawEnv(): EnvShape {
  const parsed = RawEnvSchema.parse(process.env)
  return parsed
}

export const ENV: EnvShape = loadRawEnv()

export function validateRequiredEnv() {
  const missing: string[] = []

  // core
  if (!ENV.PUBLIC_WEB_ORIGIN) missing.push('PUBLIC_WEB_ORIGIN')

  // queue
  if (!ENV.REDIS_URL) missing.push('REDIS_URL')

  // media optional - no missing tracking

  // firebase storage
  if (!ENV.FIREBASE_STORAGE_BUCKET) missing.push('FIREBASE_STORAGE_BUCKET')
  const hasJson = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  const hasB64 = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS_B64)
  const hasPath = Boolean(ENV.GOOGLE_APPLICATION_CREDENTIALS)
  if (!(hasJson || hasB64 || hasPath)) {
    missing.push('one of GOOGLE_APPLICATION_CREDENTIALS_JSON | GOOGLE_APPLICATION_CREDENTIALS_B64 | GOOGLE_APPLICATION_CREDENTIALS')
  }
  if (!ENV.HLS_PUBLIC_BASE) missing.push('HLS_PUBLIC_BASE')

  // providers optional - warn in detail field

  // security/ops
  if (!ENV.JWT_SECRET) missing.push('JWT_SECRET')
  if (!ENV.QUEUE_DASH_USER) missing.push('QUEUE_DASH_USER')
  if (!ENV.QUEUE_DASH_PASS) missing.push('QUEUE_DASH_PASS')

  // DB toggles
  if (ENV.USE_DB && ENV.DB_KIND === 'realtimedb') {
    if (!ENV.FIREBASE_DATABASE_URL) missing.push('FIREBASE_DATABASE_URL')
  }

  // Postgres keys are deprecated and should NOT be required
  // DATABASE_URL / DIRECT_URL ignored

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
    if (!process.env[key]) warnings.push(`${key} missing (optional)`) 
  }

  return { ok: missing.length === 0, missing, warnings }
}
