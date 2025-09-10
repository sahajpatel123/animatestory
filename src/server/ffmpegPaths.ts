import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

process.env.FFMPEG_PATH ||= (ffmpegStatic as unknown as string);
process.env.FFPROBE_PATH ||= (ffprobeStatic as any).path;

export const FFMPEG_PATH = process.env.FFMPEG_PATH!;
export const FFPROBE_PATH = process.env.FFPROBE_PATH!;


