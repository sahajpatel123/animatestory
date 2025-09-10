export async function resolveFfmpeg(): Promise<{ ffmpeg: string; ffprobe: string }> {
  try {
    const modFfmpeg = await import('ffmpeg-static')
    const modFfprobe = await import('ffprobe-static')
    const ffmpeg = (modFfmpeg as any).default as string
    const ffprobe = (modFfprobe as any).path as string
    return { ffmpeg: process.env.FFMPEG_PATH || ffmpeg, ffprobe: process.env.FFPROBE_PATH || ffprobe }
  } catch (e) {
    return { ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg', ffprobe: process.env.FFPROBE_PATH || 'ffprobe' }
  }
}


