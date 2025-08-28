import { getStartupConfig } from './startup'

// This file is imported at startup to validate environment variables
// It will throw an error and exit if critical variables are missing or invalid

export function validateStartupAndExit() {
  try {
    const config = getStartupConfig()
    console.log('✅ Startup validation passed')
    console.log(`📹 FFmpeg path: ${config.ffmpegPath}`)
    console.log(`🔍 FFprobe path: ${config.ffprobePath}`)
    console.log(`🌐 Public web origin: ${config.publicWebOrigin}`)
    console.log(`🗄️  Database URL: ${config.databaseUrl ? 'configured' : 'missing'}`)
    console.log(`🔴 Redis URL: ${config.redisUrl ? 'configured' : 'missing'}`)
    console.log(`🔥 Firebase bucket: ${config.firebaseBucket}`)
    console.log(`☁️  Supabase URL: ${config.supabaseUrl}`)
    return config
  } catch (error) {
    console.error('❌ Startup validation failed:', error)
    process.exit(1)
  }
}

// Run validation if this file is imported
if (require.main === module) {
  validateStartupAndExit()
}
