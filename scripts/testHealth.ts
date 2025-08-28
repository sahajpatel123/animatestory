#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { getStartupConfig } from '../src/lib/startup'

async function testHealth() {
  console.log('🧪 Testing startup validation...')
  
  try {
    const config = getStartupConfig()
    console.log('✅ Startup validation passed')
    console.log(`📹 FFmpeg: ${config.ffmpegPath}`)
    console.log(`🔍 FFprobe: ${config.ffprobePath}`)
    console.log(`🌐 Public origin: ${config.publicWebOrigin}`)
  } catch (error) {
    console.error('❌ Startup validation failed:', error)
    process.exit(1)
  }
  
  console.log('\n🚀 Starting Next.js dev server...')
  
  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: process.cwd()
  })
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('🔍 Testing health endpoint...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()
    
    console.log('📊 Health check response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.ok) {
      console.log('✅ Health check passed!')
    } else {
      console.log('❌ Health check failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Health check request failed:', error)
    process.exit(1)
  } finally {
    dev.kill()
  }
}

testHealth().catch(console.error)
