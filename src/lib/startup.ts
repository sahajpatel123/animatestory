import { spawnSync } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'

export interface StartupConfig {
  ffmpegPath: string
  ffprobePath: string
  redisUrl: string
  databaseUrl: string
  firebaseBucket: string
  googleCredentials: any
  publicWebOrigin: string
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
}

export function validateStartup(): StartupConfig {
  const errors: string[] = []
  
  // Check required environment variables
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    errors.push('REDIS_URL is required')
  }
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required')
  }
  
  const firebaseBucket = process.env.FIREBASE_STORAGE_BUCKET
  if (!firebaseBucket) {
    errors.push('FIREBASE_STORAGE_BUCKET is required')
  }
  
  const googleCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (!googleCredsJson) {
    errors.push('GOOGLE_APPLICATION_CREDENTIALS_JSON is required')
  }
  
  let googleCredentials: any = null
  if (googleCredsJson) {
    try {
      googleCredentials = JSON.parse(googleCredsJson)
      if (!googleCredentials.project_id) {
        errors.push('GOOGLE_APPLICATION_CREDENTIALS_JSON must contain valid project_id')
      }
    } catch (e) {
      errors.push('GOOGLE_APPLICATION_CREDENTIALS_JSON must be valid JSON')
    }
  }
  
  const publicWebOrigin = process.env.PUBLIC_WEB_ORIGIN
  if (!publicWebOrigin) {
    errors.push('PUBLIC_WEB_ORIGIN is required')
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required')
  }
  
  if (errors.length > 0) {
    throw new Error(`Startup validation failed:\n${errors.join('\n')}`)
  }
  
  // Determine FFmpeg paths with fallbacks
  let ffmpegPath = process.env.FFMPEG_PATH
  let ffprobePath = process.env.FFPROBE_PATH
  
  if (!ffmpegPath) {
    // Try system ffmpeg first, then fallback to static
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
    // Try system ffprobe first, then fallback to static
    const ffprobeCheck = spawnSync('ffprobe', ['-version'])
    if (ffprobeCheck.status === 0) {
      ffprobePath = 'ffprobe'
    } else {
      // For now, we'll skip ffprobe-static in ES modules
      // Users can set FFPROBE_PATH environment variable
      errors.push('FFprobe not available: set FFPROBE_PATH environment variable')
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Startup validation failed:\n${errors.join('\n')}`)
  }
  
  return {
    ffmpegPath: ffmpegPath!,
    ffprobePath: ffprobePath!,
    redisUrl: redisUrl!,
    databaseUrl: databaseUrl!,
    firebaseBucket: firebaseBucket!,
    googleCredentials,
    publicWebOrigin: publicWebOrigin!,
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    supabaseServiceKey: supabaseServiceKey!
  }
}

export function getStartupConfig(): StartupConfig {
  try {
    return validateStartup()
  } catch (error) {
    console.error('Startup validation failed:', error)
    process.exit(1)
  }
}
