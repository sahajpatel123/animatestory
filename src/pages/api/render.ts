import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'node:path'
import fs from 'fs-extra'
import crypto from 'node:crypto'
import { installGlobalErrorHandlers } from '@/lib/errors'
import { traceId, logJSON } from '@/server/debug'
import { fail } from '@/server/http/fail'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

type Line = { id: string; who: string; text: string; estMs: number }
type Scene = { id: string; title: string; shots: Array<{ id: string; durationMs?: number; prompt?: string }>; lines: Line[] }
type Plan = { projectId: string; targetSec: number; prompt?: string; scenes: Scene[] }

function jsonError(res: NextApiResponse, code: number, errCode: string, error: string) {
  return res.status(code).json({ ok: false, code: errCode, error })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, code: 'E_METHOD', error: 'Method not allowed' })
  try {
    // Lazy imports to avoid import-time side effects
    const [{ getRtdb }] = await Promise.all([
      import('@/server/firebase')
    ])
    const [
      { generateVisualsForScene }
    ] = await Promise.all([
      import('@/server/providers/visuals')
    ])
    const [{ synthesizeSceneLines }] = await Promise.all([
      import('@/server/providers/tts')
    ])
    const [{ stageMusicAndSfxForScene }] = await Promise.all([
      import('@/server/providers/audio')
    ])
    const [{ writeSrt }] = await Promise.all([
      import('@/server/media/captions')
    ])
    const [{ renderScene, renderFinal }] = await Promise.all([
      import('@/server/worker/render')
    ])
    const [{ uploadFileGCS }] = await Promise.all([
      import('@/server/gcsUpload')
    ])
    const [{ uploadDirGCS }] = await Promise.all([
      import('@/server/upload/uploadDirGCS')
    ])
    const [{ sha256File }] = await Promise.all([
      import('@/server/hash')
    ])
    const [{ ZDialoguePlan: ZPlan, checkRuntimeFit, speechDensity }] = await Promise.all([
      import('@/server/guardrails')
    ])
    const [{ ZMusicMeta, ZSfxItem }] = await Promise.all([
      import('@/types/providerSchemas')
    ])
    const [{ stubPng, stubSilence }] = await Promise.all([
      import('@/server/stubs')
    ])
    const [{ resolveFfmpeg }] = await Promise.all([
      import('@/server/ffmpegPaths')
    ])
    const tid = traceId()
    const q = req.query as any
    const b = (req.body || {}) as any
    const debug = ['true', true].includes((q.debug ?? b.debug) as any)
    const dryRun = ['true', true].includes((q.dryRun ?? b.dryRun) as any)
    const noLLM   = ['true', true].includes((q.noLLM   ?? b.noLLM) as any)
    const noVisuals = ['true', true].includes((q.noVisuals ?? b.noVisuals) as any)
    const noTTS   = ['true', true].includes((q.noTTS   ?? b.noTTS) as any)
    const noMusic = ['true', true].includes((q.noMusic ?? b.noMusic) as any)
    const noSfx   = ['true', true].includes((q.noSfx   ?? b.noSfx) as any)
    const noUpload= ['true', true].includes((q.noUpload?? b.noUpload) as any)
    const noFinal = ['true', true].includes((q.noFinal ?? b.noFinal) as any)
    logJSON('route:start', { tid, route: 'render', body: b, query: q })

    const { projectId, strict = false, regenerate = false } = b
    if (!projectId) return fail(res, 400, 'E_BAD_REQUEST', 'projectId required', { tid })

    const rtdb = await getRtdb()
    const planSnap = await rtdb.ref(`/projects/${projectId}/plan`).get()
    if (!planSnap.exists()) return fail(res, 404, 'E_PLAN_MISSING', 'DialoguePlan not found for project', { tid, stage: 'plan' })
    const plan = planSnap.val() as Plan
    try { ZPlan.parse(plan) } catch (e: any) { return jsonError(res, 422, 'E_PLAN_INVALID', e?.message || 'Plan schema invalid') }
    if (strict) {
      const fit = checkRuntimeFit(plan as any, plan.targetSec)
      const speech = speechDensity(plan as any)
      const errors: string[] = []
      if (!fit.ok) errors.push(`Runtime ${fit.actualSec}s not in [${fit.minSec},${fit.maxSec}]`)
      if (!speech.ok) errors.push(`Speech density ${(speech.pct*100).toFixed(1)}% exceeds limit`)
      if (errors.length) return fail(res, 422, 'E_GUARDRAIL', errors.join('; '), { tid, stage: 'guardrails' })
    }

    const base = path.join('/tmp', projectId)
    const dirs = ['shots', 'audio', 'music', 'sfx', 'captions', 'scenes', 'final']
    for (const d of dirs) await fs.ensureDir(path.join(base, d))

    // ffmpeg paths and versions
    try {
      const { ffmpeg, ffprobe } = await resolveFfmpeg()
      const { spawnSync } = await import('node:child_process')
      const v1 = (spawnSync(ffmpeg || 'ffmpeg', ['-version']).stdout || Buffer.from('')).toString().split('\n')[0]
      const v2 = (spawnSync(ffprobe || 'ffprobe', ['-version']).stdout || Buffer.from('')).toString().split('\n')[0]
      logJSON('ffmpeg:paths', { tid, ffmpeg, ffprobe, ffmpegVersion: v1, ffprobeVersion: v2 })
    } catch {}

    // Per-scene targetMs + chapters
    const chapters: Array<{ sceneId: string; startMs: number }> = []
    const sceneTargetMs: number[] = []
    let cursor = 0
    for (const sc of plan.scenes) {
      let ms = 0
      if (sc.shots?.length && sc.shots.every(s => typeof s.durationMs === 'number')) {
        ms = sc.shots.reduce((a, b) => a + (b.durationMs || 0), 0)
      } else {
        ms = Math.round((plan.targetSec * 1000) / Math.max(1, plan.scenes.length))
      }
      sceneTargetMs.push(ms)
      chapters.push({ sceneId: sc.id, startMs: cursor })
      cursor += ms
    }

    // Idempotency
    if (!regenerate) {
      const r = await rtdb.ref(`/renders/${projectId}`).get()
      const existing = r.exists() ? r.val() : null
      if (existing?.finalUrl && existing?.hlsUrl) {
        try {
          const head = await fetch(existing.finalUrl, { method: 'HEAD' })
          if (head.ok) return res.status(200).json({ ok: true, projectId, finalUrl: existing.finalUrl, hlsUrl: existing.hlsUrl, scenes: existing.scenes || [], chapters: existing.chapters || [], manifestUrl: existing.manifestUrl || '' })
        } catch {}
      }
    }

    // Render scenes
    const outputs: Array<{ id: string; mp4Path: string; thumbPath: string }> = []
    for (let i = 0; i < plan.scenes.length; i++) {
      const sc = plan.scenes[i]
      const scMs = sceneTargetMs[i]
      let tries = 0
      // Visuals
      try {
        if (noVisuals) {
          for (const s of sc.shots) {
            const p = path.join(base, 'shots', `${s.id}.png`)
            await stubPng(p, 1280, 720, 'black')
            logJSON('visuals:shot', { tid, sceneId: sc.id, shotId: s.id, provider: 'stub', seed: 0, path: p })
          }
        } else {
          while (tries < 3) { try { await generateVisualsForScene(sc as any, projectId); break } catch { tries++; await new Promise(r => setTimeout(r, 200 * tries)) } }
        }
      } catch (e) { return fail(res, 502, 'E_VISUALS', e, { tid, stage: 'visuals', sceneId: sc.id }) }
      // TTS
      tries = 0
      try {
        if (noTTS) {
          for (const l of sc.lines) {
            const p = path.join(base, 'audio', `${l.id}.wav`)
            await stubSilence(p, 200)
            logJSON('tts:line', { tid, sceneId: sc.id, lineId: l.id, who: l.who, durationMs: 200, path: p })
          }
        } else {
          while (tries < 3) { try { await synthesizeSceneLines(sc as any, projectId); break } catch { tries++; await new Promise(r => setTimeout(r, 200 * tries)) } }
        }
      } catch (e) { return fail(res, 502, 'E_TTS', e, { tid, stage: 'tts', sceneId: sc.id }) }
      // Music/SFX
      let music: any, sfx: any[] = []
      try {
        if (noMusic && noSfx) { music = undefined; sfx = [] }
        else {
          const staged = await stageMusicAndSfxForScene(sc as any, projectId, scMs)
          music = noMusic ? undefined : staged.music
          sfx = noSfx ? [] : (staged.sfx || [])
        }
        if (music) ZMusicMeta.parse(music)
        if (sfx) ZSfxItem.array().parse(sfx)
        logJSON('audio:scene', { tid, sceneId: sc.id, music: !!music?.musicPath, sfxCount: sfx.length })
      } catch (e) { return fail(res, 502, 'E_AUDIO', e, { tid, stage: 'audio', sceneId: sc.id }) }
      // Captions SRT
      const srtPath = path.join(base, 'captions', `${sc.id}.srt`)
      if (!(await fs.pathExists(srtPath))) await writeSrt((sc.lines as any).map((ln: any) => ({ ...ln, text: (ln.caption || ln.text) })), srtPath, scMs)

      // Build SceneJob
      const outPath = path.join(base, 'scenes', `scene_${String(i).padStart(2, '0')}.mp4`)
      const shots = sc.shots.map(s => ({ bgPath: path.join(base, 'shots', `${s.id}.png`), durationMs: s.durationMs || Math.round(scMs / Math.max(1, sc.shots.length)) }))
      const dialogueWavs = sc.lines.map(l => ({ id: l.id, who: l.who, wavPath: path.join(base, 'audio', `${l.id}.wav`) }))
      const job = { sceneId: sc.id, projectId, shots, dialogueWavs, captionsSrtPath: srtPath, musicPath: (music as any)?.musicPath, sfx, outPath }
      if (dryRun) continue
      try {
        const { mp4Path, thumbPath } = await renderScene(job as any)
        logJSON('renderScene', { tid, stage: 'renderScene', sceneId: sc.id, outPath: job.outPath, thumbPath })
        outputs.push({ id: sc.id, mp4Path, thumbPath })
      } catch (e: any) {
        return fail(res, 500, 'E_SCENE_RENDER', e, { tid, stage: 'renderScene', sceneId: sc.id })
      }
    }

    // Final
    const sceneMp4s = outputs.map(o => o.mp4Path)
    const finalDir = path.join(base, 'final')
    await fs.ensureDir(finalDir)
    let finalMp4 = ''; let hlsDir = ''
    if (!dryRun && !noFinal) {
      try {
        const out = await renderFinal(projectId, sceneMp4s, finalDir)
        finalMp4 = out.finalMp4; hlsDir = out.hlsDir
        logJSON('renderFinal', { tid, stage: 'renderFinal', outFinal: finalMp4, hlsDir })
      } catch (e: any) {
        return fail(res, 500, 'E_FINAL_RENDER', e, { tid, stage: 'renderFinal' })
      }
    }

    // Uploads
    const scenes: Array<{ id: string; url: string; thumbUrl: string }> = []
    let finalUrl = ''
    let hlsUrl = ''
    if (!dryRun && !noUpload) {
      try {
        for (let i = 0; i < outputs.length; i++) {
          const o = outputs[i]
          const url = await uploadFileGCS(`renders/${projectId}/scenes/scene_${String(i).padStart(2, '0')}.mp4`, o.mp4Path, 31536000)
          const thumbUrl = await uploadFileGCS(`renders/${projectId}/thumbs/scene_${String(i).padStart(2, '0')}.png`, o.thumbPath, 31536000)
          logJSON('upload', { tid, object: `renders/${projectId}/scenes/scene_${String(i).padStart(2, '0')}.mp4`, url })
          scenes.push({ id: o.id, url, thumbUrl })
        }
        if (finalMp4) {
          finalUrl = await uploadFileGCS(`renders/${projectId}/final.mp4`, finalMp4, 31536000)
          logJSON('upload', { tid, object: `renders/${projectId}/final.mp4`, url: finalUrl })
        }
        if (hlsDir) {
          await uploadDirGCS(hlsDir, `hls/${projectId}`, 600)
          hlsUrl = `${process.env.HLS_PUBLIC_BASE}${encodeURIComponent(projectId)}%2Fstream.m3u8?alt=media`
        }
      } catch (e: any) {
        return fail(res, 502, 'E_UPLOAD', e, { tid, stage: 'upload' })
      }
    }

    // Manifest
    const manifest = {
      projectId,
      prompt: plan.prompt || '',
      targetSec: plan.targetSec,
      models: { llm: 'openai', visuals: 'sdxl|openai', tts: 'elevenlabs', music: process.env.STABLE_AUDIO_API_KEY ? 'stable-audio' : 'loops' },
      seeds: Object.fromEntries(plan.scenes.flatMap(s => s.shots.map((sh: any) => [sh.id, sh.seed]))),
      files: { sceneMp4s, finalMp4, hlsIndex: 'stream.m3u8' },
      checksums: Object.fromEntries(await Promise.all(sceneMp4s.concat([finalMp4]).map(async p => [path.basename(p), await sha256File(p)]))),
      loudnorm: {},
      createdAtISO: new Date().toISOString()
    }
    const manifestPath = path.join(finalDir, 'render_manifest.json')
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 })
    const manifestUrl = await uploadFileGCS(`renders/${projectId}/render_manifest.json`, manifestPath, 31536000)

    // Persist
    const record = { finalUrl, hlsUrl, scenes, chapters, manifestUrl, updatedAtISO: new Date().toISOString() }
    if (!dryRun) await rtdb.ref(`/renders/${projectId}`).set(record)

    if (dryRun) {
      const list = async (d: string) => (await fs.pathExists(path.join(base, d))) ? (await fs.readdir(path.join(base, d))) : []
      const files = { shots: await list('shots'), audio: await list('audio'), captions: await list('captions') }
      logJSON('route:done', { tid, route: 'render', projectId, ok: true, dryRun: true })
      return res.status(200).json({ ok: true, dryRun: true, projectId, stages: { visuals: !noVisuals, tts: !noTTS, music: !noMusic, sfx: !noSfx }, files })
    }
    logJSON('route:done', { tid, route: 'render', projectId, ok: true })
    return res.status(200).json({ ok: true, projectId, finalUrl, hlsUrl, scenes, chapters, manifestUrl })
  } catch (e: any) {
    return fail(res, 500, 'E_INTERNAL', e, { stage: 'unknown' })
  }
}


