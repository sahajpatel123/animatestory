import { semanticSeed } from '@/lib/seed'

export type ShotPlan = { index: number; duration_ms: number; camera: 'cut'|'pan'|'zoom'; background_prompt: string; characters?: string[] }
export type AssetPlan = { scenes: Array<{ index: number; shots: ShotPlan[]; seed: number }> }

export function buildAssetPlan(dialoguePlan: { scenes: Array<{ index: number; title: string; mood: string; dialogue: Array<{ speaker: string; text: string }> }> }, targetSec: number): AssetPlan {
  const shotsPerScene = 2
  return {
    scenes: dialoguePlan.scenes.map((s) => {
      const baseSeed = semanticSeed(`${s.title}-${s.mood}`)
      const shots: ShotPlan[] = Array.from({ length: shotsPerScene }, (_, i) => ({
        index: i,
        duration_ms: Math.round((targetSec * 1000) / (dialoguePlan.scenes.length * shotsPerScene)),
        camera: (i % 3 === 0 ? 'cut' : i % 3 === 1 ? 'pan' : 'zoom'),
        background_prompt: `${s.mood} ${s.title} cinematic ANIMATIVE, hand-drawn stylized background, ink-and-wash, cel-shaded, high contrast, not photorealistic`,
        characters: Array.from(new Set(s.dialogue.map(d => d.speaker))).slice(0, 2),
      }))
      return { index: s.index, shots, seed: baseSeed }
    })
  }
}

export async function generateBackgrounds(assetPlan: AssetPlan) {
  const sdxlKey = process.env.STABILITY_API_KEY
  const dalleKey = process.env.OPENAI_API_KEY
  // If missing keys, return deterministic placeholders
  if (!sdxlKey && !dalleKey) {
    return assetPlan.scenes.flatMap(sc => sc.shots.map(sh => ({
      scene: sc.index,
      shot: sh.index,
      url: `https://placehold.co/1280x720?text=Scene%20${sc.index+1}%20Shot%20${sh.index+1}`,
      seed: sc.seed + sh.index,
    })))
  }
  // Outline: call SDXL with prompt and seed per shot; fallback to DALL·E 3
  return []
}


