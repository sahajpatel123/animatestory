import { Scene, Shot } from '@/types/story'

const MIN_SHOT_MS = 3500
const MAX_SHOT_MS = 10000

export function scaleRuntimeToTarget(scenes: Scene[], targetSec: number): Scene[] {
  const targetMs = targetSec * 1000
  const allShots = scenes.flatMap(s => s.shots)
  const actualMs = allShots.reduce((sum, sh) => sum + sh.durationMs, 0)
  const scale = targetMs / Math.max(actualMs, 1)

  // First scale
  for (const scene of scenes) {
    for (const shot of scene.shots) {
      shot.durationMs = Math.round(shot.durationMs * scale)
      if (shot.durationMs < MIN_SHOT_MS) shot.durationMs = MIN_SHOT_MS
      if (shot.durationMs > MAX_SHOT_MS) shot.durationMs = MAX_SHOT_MS
    }
  }

  // Renormalize if necessary
  const totalAfterClamp = scenes.flatMap(s => s.shots).reduce((a, s) => a + s.durationMs, 0)
  if (totalAfterClamp !== targetMs) {
    const factor = targetMs / totalAfterClamp
    for (const scene of scenes) {
      for (const shot of scene.shots) {
        shot.durationMs = Math.round(shot.durationMs * factor)
        if (shot.durationMs < MIN_SHOT_MS) shot.durationMs = MIN_SHOT_MS
        if (shot.durationMs > MAX_SHOT_MS) shot.durationMs = MAX_SHOT_MS
      }
    }
  }

  // Verify within ±10%
  const finalTotal = scenes.flatMap(s => s.shots).reduce((a, s) => a + s.durationMs, 0)
  const lower = targetMs * 0.9
  const upper = targetMs * 1.1
  if (finalTotal < lower || finalTotal > upper) {
    // Adjust last shots slightly to fit bounds
    const diff = targetMs - finalTotal
    const shotsDesc: Shot[] = scenes.flatMap(s => s.shots)
    for (let i = shotsDesc.length - 1; i >= 0 && Math.abs(diff) > 0; i--) {
      const delta = Math.sign(diff) * Math.min(Math.abs(diff), 200)
      const newVal = shotsDesc[i].durationMs + delta
      if (newVal >= MIN_SHOT_MS && newVal <= MAX_SHOT_MS) {
        shotsDesc[i].durationMs = newVal
      }
    }
  }

  // Update scene.targetMs to sum of shots
  for (const scene of scenes) {
    scene.targetMs = scene.shots.reduce((a, s) => a + s.durationMs, 0)
  }
  return scenes
}


