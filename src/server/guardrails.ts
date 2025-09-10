import { z } from 'zod'

export const LIMITS = {
  runtimeTolerancePct: Number(process.env.RUNTIME_TOLERANCE_PCT || 10),
  maxCaptionChars: Number(process.env.MAX_CAPTION_CHARS || 42),
  maxCaptionLines: Number(process.env.MAX_CAPTION_LINES || 2),
  maxSpeechPct: Number(process.env.MAX_SPEECH_PCT || 0.6),
}

export const ZLine = z.object({ id: z.string(), who: z.string(), text: z.string(), estMs: z.number().int().nonnegative(), caption: z.string().optional() })
export const ZShot = z.object({ id: z.string(), seed: z.number().int().nonnegative().optional(), prompt: z.string().optional(), durationMs: z.number().int().positive().optional(), camera: z.string().optional() })
export const ZScene = z.object({ id: z.string(), title: z.string(), shots: z.array(ZShot), lines: z.array(ZLine) })
export const ZDialoguePlan = z.object({ projectId: z.string(), targetSec: z.number().int().positive(), scenes: z.array(ZScene) })
export type DialoguePlan = z.infer<typeof ZDialoguePlan>
export type Scene = z.infer<typeof ZScene>

export function checkRuntimeFit(plan: DialoguePlan, targetSec: number, tolerancePct = LIMITS.runtimeTolerancePct) {
  const totalMs = (plan.scenes || []).flatMap(s => s.shots || []).reduce((a, b) => a + (b.durationMs || 0), 0)
  const actualSec = Math.round(totalMs / 1000)
  const minSec = Math.round(targetSec * (1 - tolerancePct / 100))
  const maxSec = Math.round(targetSec * (1 + tolerancePct / 100))
  const ok = actualSec >= minSec && actualSec <= maxSec
  return { ok, actualSec, minSec, maxSec }
}

export function speechDensity(plan: DialoguePlan) {
  const totalMs = (plan.scenes || []).flatMap(s => s.shots || []).reduce((a, b) => a + (b.durationMs || 0), 0)
  const speechMs = (plan.scenes || []).flatMap(s => s.lines || []).reduce((a, b) => a + (b.estMs || 0), 0)
  const pct = totalMs > 0 ? speechMs / totalMs : 0
  const ok = pct <= LIMITS.maxSpeechPct
  return { ok, speechMs, totalMs, pct }
}

export function clampCaption(text: string): string[] {
  const maxChars = LIMITS.maxCaptionChars
  const maxLines = LIMITS.maxCaptionLines
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length <= maxChars) cur = next
    else { if (cur) lines.push(cur); cur = w }
    if (lines.length >= maxLines) break
  }
  if (lines.length < maxLines && cur) lines.push(cur)
  return lines.slice(0, maxLines).map(l => (l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l))
}

export function validateSceneCaptions(scene: Scene) {
  const problems: Array<{ lineId: string; msg: string }> = []
  for (const ln of scene.lines || []) {
    const lines = clampCaption(ln.text)
    if (lines.length > LIMITS.maxCaptionLines) problems.push({ lineId: ln.id, msg: 'Caption exceeds max lines' })
    for (const l of lines) if (l.length > LIMITS.maxCaptionChars) problems.push({ lineId: ln.id, msg: 'Caption exceeds max chars' })
  }
  return { ok: problems.length === 0, problems }
}

const EPIC_NAMES = ['Rama', 'Sita', 'Lakshmana', 'Hanuman', 'Ravana', 'Ayodhya', 'Lanka']
export function culturalNameConsistency(plan: DialoguePlan) {
  const names = new Set<string>()
  for (const sc of plan.scenes || []) for (const ln of sc.lines || []) for (const n of EPIC_NAMES) if (ln.text.includes(n)) names.add(n)
  const notes: string[] = []
  if (names.size) notes.push(`Detected canonical names: ${Array.from(names).join(', ')}`)
  return { ok: true, notes }
}

export function rejectUnsafePrompt(prompt: string) {
  const p = (prompt || '').toLowerCase()
  const disallow = [
    { re: /(minor|underage).*(sexual|sex|nsfw)/, reason: 'Sexual content involving minors is disallowed' },
    { re: /(suicide|self\s*-?harm|how to harm)/, reason: 'Self-harm instructions are disallowed' },
    { re: /(kill all|genocide|racial slur|hate.*group)/, reason: 'Hate or violence against protected classes is disallowed' },
    { re: /(gore|graphic violence|dismemberment)/, reason: 'Graphic violence is disallowed' },
  ]
  for (const { re, reason } of disallow) if (re.test(p)) return { ok: false, reason }
  return { ok: true as const }
}


