import fs from 'fs-extra'
import path from 'node:path'

export async function generateImage(prompt: string, seed: number, outPath: string) {
  const stability = process.env.STABILITY_API_KEY
  const openai = process.env.OPENAI_API_KEY
  await fs.ensureDir(path.dirname(outPath))

  if (stability) {
    const resp = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stability}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: `${prompt}, ANIMATIVE hand-drawn style, cel-shaded, not photorealistic` }],
        cfg_scale: 7,
        height: 576,
        width: 1024,
        samples: 1,
        steps: 30,
        seed,
      })
    })
    if (resp.ok) {
      const data: any = await resp.json()
      const b64 = data?.artifacts?.[0]?.base64
      if (b64) {
        const buf = Buffer.from(b64, 'base64')
        await fs.writeFile(outPath, buf)
        return outPath
      }
    }
  }

  if (openai) {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `${prompt}, ANIMATIVE hand-drawn style, cel-shaded, not photorealistic`,
        size: '1024x576',
        response_format: 'b64_json',
      })
    })
    if (resp.ok) {
      const data: any = await resp.json()
      const b64 = data?.data?.[0]?.b64_json
      if (b64) {
        const buf = Buffer.from(b64, 'base64')
        await fs.writeFile(outPath, buf)
        return outPath
      }
    }
  }

  // Fallback placeholder
  const ph = await fetch('https://placehold.co/1024x576.png?text=ANIMATIVE')
  const buf = Buffer.from(await ph.arrayBuffer())
  await fs.writeFile(outPath, buf)
  return outPath
}


