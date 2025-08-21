export type Character = {
  id: string
  name: string
  palette: { primary: string; secondary: string }
  poses: Array<'neutral' | 'happy' | 'action'>
  ttsVoice: string
}

export type Dialogue = {
  speaker: string
  text: string
}

export type Shot = {
  index: number
  durationMs: number
  camera: string
  backgroundPrompt: string
  caption: string
  dialogue?: Dialogue
}

export type Scene = {
  index: number
  title: string
  mood: string
  targetMs: number
  shots: Shot[]
}

export type Project = {
  id: string
  title: string
  targetSec: number
  style: string
  characters: Character[]
}

export type RenderPlan = {
  fps: number
  width: number
  height: number
  audioMix: { ducking: true }
}

export type StoryJSON = {
  project: Project
  acts: Array<'Act I' | 'Act II' | 'Act III'>
  scenes: Scene[]
  assets: Array<{ id: string; type: string; url: string; meta: Record<string, unknown> }>
  render_plan: RenderPlan
}


