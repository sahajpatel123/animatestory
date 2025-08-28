import { spawnSync } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'

export interface StartupConfig {
  ffmpegPath: string
  ffprobePath: string
  redisUrl?: string
  firebaseBucket?: string
  googleCredentials?: any
  publicWebOrigin?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceKey?: string
}

export function validateStartup(): StartupConfig {
  const errors: string[] = []
  
  // Optional pointers for diagnostics only (no hard requirements here)
  const redisUrl = process.env.REDIS_URL
  const firebaseBucket = process.env.FIREBASE_STORAGE_BUCKET
  const publicWebOrigin = process.env.PUBLIC_WEB_ORIGIN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const googleCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  let googleCredentials: any = undefined
  if (googleCredsJson) {
    try {
      googleCredentials = JSON.parse(googleCredsJson)
    } catch (e) {
      // do not fail build; health endpoint will report env issues separately
    }
  }
  
  // Determine FFmpeg paths with fallbacks
  let ffmpegPath = process.env.FFMPEG_PATH
  let ffprobePath = process.env.FFPROBE_PATH
  
  if (!ffmpegPath) {
    const ffmpegCheck = spawnSync('ffmpeg', ['-version'])
    if (ffmpegCheck.status === 0) {
      ffmpegPath = 'ffmpeg'
    } else if (ffmpegStatic) {
      ffmpegPath = ffmpegStatic
    } else {
      errors.push('FFmpeg not available: neither system ffmpeg nor ffmpeg-static found')
    }
  }
  
  if (!ffprobePath) {
    const ffprobeCheck = spawnSync('ffprobe', ['-version'])
    if (ffprobeCheck.status === 0) {
      ffprobePath = 'ffprobe'
    } else {
      // Allow health to continue; report via errors for visibility
      errors.push('FFprobe not available: set FFPROBE_PATH or ensure system ffprobe present')
    }
  }
  
  if (errors.length > 0) {
    // Do not exit here; just provide config. Health endpoint decides status.
  }
  
  return {
    ffmpegPath: ffmpegPath || 'ffmpeg',
    ffprobePath: ffprobePath || 'ffprobe',
    redisUrl,
    firebaseBucket,
    googleCredentials,
    publicWebOrigin,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey
  }
}

export function getStartupConfig(): StartupConfig {
  return validateStartup()
}
