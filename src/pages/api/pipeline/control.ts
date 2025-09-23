import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { traceId, logJSON } from '@/server/debug'
import { fail } from '@/server/http/fail'
import crypto from 'node:crypto'
import { semanticSeed } from '@/lib/seed'
import { isPromptSafe } from '@/lib/guardrails'

export const config = { runtime: 'nodejs' }

const Line = z.object({ id: z.string(), who: z.string(), text: z.string().min(1), estMs: z.number().int().nonnegative(), caption: z.string().optional() })
const Shot = z.object({ id: z.string(), seed: z.number().int().nonnegative(), prompt: z.string().min(1), durationMs: z.number().int().positive(), camera: z.string().min(1) })
const Scene = z.object({ id: z.string(), title: z.string(), shots: z.array(Shot), lines: z.array(Line) })
const DialoguePlan = z.object({ projectId: z.string(), targetSec: z.number().int().positive(), scenes: z.array(Scene) })

function hashKey(prompt: string, targetSec: number) {
  return crypto.createHash('sha256').update(`${prompt}|${targetSec}`).digest('hex')
}

function wrap(text: string, max = 42) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length <= max) cur = next
    else { if (cur) lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function validateGuards(plan: z.infer<typeof DialoguePlan>) {
  const errors: string[] = []
  const totalShotMs = plan.scenes.flatMap(s => s.shots).reduce((a, b) => a + b.durationMs, 0)
  const totalSpeechMs = plan.scenes.flatMap(s => s.lines).reduce((a, b) => a + b.estMs, 0)
  if (totalShotMs < plan.targetSec * 1000 * 0.9 || totalShotMs > plan.targetSec * 1000 * 1.1) {
    errors.push('Runtime not within ±10% of target')
  }
  if (totalSpeechMs > totalShotMs * 0.6) {
    errors.push('Speech density exceeds 60% of runtime')
  }
  for (const sc of plan.scenes) {
    for (const ln of sc.lines) {
      const lines = wrap(ln.text, 42)
      for (const l of lines) if (l.length > 42) errors.push(`Caption too long in scene ${sc.id}`)
      if (lines.length > 2) errors.push(`Caption exceeds 2 lines in scene ${sc.id}`)
    }
  }
  return { ok: errors.length === 0, errors }
}

async function getCachedPlan(projectId: string, cacheKey: string) {
  try {
    const { getRtdb } = await import('@/server/firebase')
    const db = await getRtdb()
    const snap = await db.ref(`/cache/dialoguePlans/${cacheKey}`).get()
    if (snap.exists()) return snap.val()
  } catch {}
  return null
}

async function storePlan(projectId: string, cacheKey: string, plan: any) {
  try {
    const { getRtdb } = await import('@/server/firebase')
    const db = await getRtdb()
    await db.ref(`/projects/${projectId}/plan`).set(plan)
    await db.ref(`/cache/dialoguePlans/${cacheKey}`).set(plan)
  } catch {}
}

async function callOpenAI(prompt: string, targetSec: number, projectId: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const model = 'gpt-4o-mini'
  const sys = `You are a planner that outputs ONLY valid JSON matching this schema with no extra text. DialoguePlan { projectId:string; targetSec:number; scenes: Scene[] } Scene { id:string; title:string; shots: Shot[]; lines: Line[] } Shot { id:string; seed:number; prompt:string; durationMs:number; camera:string } Line { id:string; who:string; text:string; estMs:number } Rules: 12-16 scenes, 2-3 shots/scene, 1-3 lines/scene, <=18 words/line, animative-only visuals, total runtime within ±10%, speech <=60%. Use deterministic seeds.`
  const user = `Create a DialoguePlan for: ${prompt}\nTarget seconds: ${targetSec}\nprojectId: ${projectId}`
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0 })
  })
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}`)
  const data: any = await resp.json()
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('LLM returned empty content')
  let json: any
  try { json = JSON.parse(content) } catch { throw new Error('LLM did not return JSON') }
  // Fill seeds if missing deterministically
  for (const sc of json.scenes) {
    sc.id ||= crypto.randomUUID()
    for (const [i, sh] of (sc.shots || []).entries()) {
      if (typeof sh.seed !== 'number') sh.seed = semanticSeed(`${sc.id}:${i}:${sh.prompt}`)
    }
    for (const ln of (sc.lines || [])) ln.id ||= crypto.randomUUID()
  }
  return json
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const [{ rejectUnsafePrompt, checkRuntimeFit, speechDensity, clampCaption, ZDialoguePlan: ZPlan }] = await Promise.all([
      import('@/server/guardrails')
    ])
    const cryptoMod = await import('node:crypto')
    const crypto = cryptoMod.default || (cryptoMod as any)
    const [{ getRtdb }] = await Promise.all([
      import('@/server/firebase')
    ])
    const tid = traceId()
    const q = req.query as any
    const b = (req.body || {}) as any
    const debug = ['true', true].includes((q.debug ?? b.debug) as any)
    const dryRun = ['true', true].includes((q.dryRun ?? b.dryRun) as any)
    const noLLM   = ['true', true].includes((q.noLLM   ?? b.noLLM) as any)

    logJSON('route:start', { tid, route: 'control', body: b, query: q })

    const { prompt, targetSec = 240, projectId: incomingId, strict = false } = b
    if (!prompt) return res.status(400).json({ ok: false, error: 'Invalid prompt' })
    const unsafe = rejectUnsafePrompt(prompt)
    if (!unsafe.ok) return res.status(422).json({ ok: false, code: 'E_UNSAFE_PROMPT', reason: unsafe.reason })
    const projectId = incomingId || (crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2)))
    const cacheKey = hashKey(prompt, Number(targetSec))

    // Cache
    const cached = await getCachedPlan(projectId, cacheKey)
    if (cached) {
      logJSON('control:plan', { tid, cached: true, projectId, targetSec, warnings: (cached?.validation?.warnings || []).length })
      return res.status(200).json({ ok: true, projectId, plan: cached, cached: true, validation: cached.validation })
    }

    // Call OpenAI
    if (noLLM || dryRun) {
      const empty = { projectId, targetSec: Number(targetSec), scenes: [], validation: { warnings: ['dryRun/noLLM'] } }
      logJSON('control:plan', { tid, cached: false, projectId, targetSec, warnings: 1 })
      return res.status(200).json({ ok: true, projectId, plan: empty, validation: empty.validation, dryRun: true })
    }
    const raw = await callOpenAI(prompt, Number(targetSec), projectId)
    const parsed = DialoguePlan.parse(raw)
    // Extra validation with shared schema
    const zparsed = ZPlan.parse(parsed)
    const fit = checkRuntimeFit(zparsed, Number(targetSec))
    const speech = speechDensity(zparsed)
    const warnings: string[] = []
    if (!fit.ok) { if (strict) return res.status(422).json({ ok: false, code: 'E_RUNTIME_FIT', error: `Runtime ${fit.actualSec}s not in [${fit.minSec},${fit.maxSec}]` }); else warnings.push('Runtime slightly out of tolerance') }
    if (!speech.ok) { if (strict) return res.status(422).json({ ok: false, code: 'E_SPEECH_DENSITY', error: `Speech ${(speech.pct*100).toFixed(1)}% exceeds limit` }); else warnings.push('Speech density high') }
    for (const sc of zparsed.scenes) for (const ln of sc.lines) ln.caption = clampCaption(ln.text).join('\n')

    const toPersist = { ...zparsed, validation: { runtime: fit, speech: { pct: speech.pct, ok: speech.ok }, warnings } }
    await storePlan(projectId, cacheKey, toPersist)
    logJSON('control:plan', { tid, cached: false, projectId, targetSec, warnings: warnings.length })
    logJSON('route:done', { tid, route: 'control', projectId, ok: true })
    return res.status(200).json({ ok: true, projectId, plan: toPersist, validation: toPersist.validation })
  } catch (e: any) {
    return fail(res, 500, 'E_PIPELINE', e)
  }
}


