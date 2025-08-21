import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegStatic || '')

export function renderMp4(framesGlob: string, mixWav: string, outPath: string, fps = 30) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(framesGlob)
      .inputOptions([`-r ${fps}`])
      .input(mixWav)
      .videoCodec('libx264')
      .outputOptions(['-crf 18', '-preset medium', '-pix_fmt yuv420p'])
      .audioCodec('aac')
      .audioBitrate('192k')
      .save(outPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  })
}

export function renderHls(framesGlob: string, mixWav: string, outDir: string, fps = 30) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(framesGlob)
      .inputOptions([`-r ${fps}`])
      .input(mixWav)
      .videoCodec('libx264')
      .outputOptions([
        '-crf 20',
        '-preset veryfast',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-f hls',
        '-hls_time 4',
        '-hls_playlist_type vod',
      ])
      .audioCodec('aac')
      .audioBitrate('128k')
      .save(`${outDir}/index.m3u8`)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  })
}


