import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  prompt: z.string(),
  targetSec: z.number().int().positive(),
  style: z.string().default('default'),
  status: z.string().default('new'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})
export type Project = z.infer<typeof ProjectSchema>

export const SceneSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  index: z.number().int().nonnegative(),
  title: z.string(),
  mood: z.string(),
  targetMs: z.number().int().positive(),
})
export type Scene = z.infer<typeof SceneSchema>

export const RenderRecordSchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url(),
  hlsUrl: z.string().url().optional(),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  runtimeMs: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime().optional(),
})
export type RenderRecord = z.infer<typeof RenderRecordSchema>

export type DialoguePlan = {
  scenes: Array<{
    index: number
    title: string
    mood: string
    dialogue: Array<{ speaker: string; text: string }>
  }>
}
