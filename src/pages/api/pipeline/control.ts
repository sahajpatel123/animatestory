import type { NextApiRequest, NextApiResponse } from 'next'
import { isPromptSafe } from '@/lib/guardrails'
import { generateDialoguePlan } from '@/server/providers/llm'
import { buildAssetPlan } from '@/server/providers/assets'
import { buildAudioPlan } from '@/server/providers/audio'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { prompt, targetSec = 240, video_api_enabled = false } = req.body || {}
    if (!prompt || !isPromptSafe(prompt)) return res.status(400).json({ error: 'Invalid or unsafe prompt' })

    // 1) Dialogue plan
    const dialogue_plan = await generateDialoguePlan(prompt, Number(targetSec))

    // 2) Asset plan (images or video, seed based)
    const asset_plan = buildAssetPlan(dialogue_plan as any, Number(targetSec))

    // 3) Audio plan (voices, sfx, music, mixing)
    const audio_plan = buildAudioPlan(dialogue_plan as any)

    // 4) Render plan summary
    const render_plan = { fps: 30, width: 1920, height: 1080, audioMix: { ducking: true }, hls: true }

    // Audit
    const audit = { guardrails: { dialogueLimits: '≤3 lines/scene, ≤18 words/line, ≤60% speech', culturalRespect: true, runtimeFit: true }, providers: { llm: process.env.ANTHROPIC_API_KEY ? 'anthropic' : (process.env.OPENAI_API_KEY ? 'openai' : 'stub'), images: process.env.STABILITY_API_KEY ? 'stability_sdxl' : (process.env.OPENAI_API_KEY ? 'dalle3' : 'stub'), tts: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'openai' } }

    return res.status(200).json({ CONTROL: { dialogue_plan, asset_plan, audio_plan, render_plan, audit } })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Pipeline error' })
  }
}


