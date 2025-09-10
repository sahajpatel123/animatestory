import { z } from 'zod'

export const ZLine = z.object({ id: z.string(), who: z.string(), text: z.string(), estMs: z.number().int().nonnegative(), caption: z.string().optional() })
export const ZShot = z.object({ id: z.string(), seed: z.number().int().nonnegative(), prompt: z.string(), durationMs: z.number().int().positive(), camera: z.string() })
export const ZScene = z.object({ id: z.string(), title: z.string(), shots: z.array(ZShot), lines: z.array(ZLine) })
export const ZDialoguePlan = z.object({ projectId: z.string(), targetSec: z.number().int().positive(), scenes: z.array(ZScene) })

export const ZVisualMeta = z.object({ localPath: z.string(), seed: z.number(), provider: z.string(), prompt: z.string() })
export const ZTTSMeta = z.object({ wavPath: z.string(), durationMs: z.number().positive(), provider: z.literal('elevenlabs').or(z.literal('local-cache')).or(z.literal('cache-remote')) })
export const ZMusicMeta = z.object({ musicPath: z.string(), durationMs: z.number().positive() })
export const ZSfxItem = z.object({ path: z.string(), atMs: z.number().nonnegative(), label: z.string() })

export type DialoguePlan = z.infer<typeof ZDialoguePlan>
export type Scene = z.infer<typeof ZScene>
export type VisualMeta = z.infer<typeof ZVisualMeta>
export type TTSMeta = z.infer<typeof ZTTSMeta>
export type MusicMeta = z.infer<typeof ZMusicMeta>
export type SfxItem = z.infer<typeof ZSfxItem>


