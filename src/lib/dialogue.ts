import { Scene } from '@/types/story'

const MAX_LINES_PER_SCENE = 3
const MAX_WORDS_PER_LINE = 16
const MAX_CAPTION_CHARS_PER_LINE = 42
const MAX_CAPTION_LINES = 2

export type DialogueValidation = {
  ok: boolean
  errors: string[]
}

export function validateDialogue(scenes: Scene[], targetSec: number): DialogueValidation {
  const errors: string[] = []
  const totalMs = scenes.flatMap(s => s.shots).reduce((a, s) => a + s.durationMs, 0)

  let spokenMs = 0
  for (const scene of scenes) {
    const lines = scene.shots.map(s => s.dialogue?.text).filter(Boolean) as string[]
    if (lines.length > MAX_LINES_PER_SCENE) {
      errors.push(`Scene ${scene.index} has more than ${MAX_LINES_PER_SCENE} lines`)
    }
    for (const [i, text] of lines.entries()) {
      const words = text.trim().split(/\s+/)
      if (words.length > MAX_WORDS_PER_LINE) {
        errors.push(`Scene ${scene.index} line ${i + 1} exceeds ${MAX_WORDS_PER_LINE} words`)
      }

      const captionLines = wrapCaption(text, MAX_CAPTION_CHARS_PER_LINE)
      if (captionLines.length > MAX_CAPTION_LINES) {
        errors.push(`Scene ${scene.index} line ${i + 1} caption exceeds ${MAX_CAPTION_LINES} lines`)
      }
    }

    // crude estimation: 150 wpm -> 400ms per word
    const numWords = lines.reduce((acc, t) => acc + t.trim().split(/\s+/).length, 0)
    spokenMs += Math.round((numWords / 150) * 60 * 1000)
  }

  if (spokenMs > totalMs * 0.6) {
    errors.push('Speech density exceeds 60% of runtime')
  }

  return { ok: errors.length === 0, errors }
}

export function wrapCaption(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + (line ? ' ' : '') + w).length <= maxChars) {
      line = line ? line + ' ' + w : w
    } else {
      if (line) lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines
}


