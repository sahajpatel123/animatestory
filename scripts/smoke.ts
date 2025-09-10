// ts-node compatible smoke script
import 'cross-fetch/polyfill'

function arg(name: string, def?: string) {
  const ix = process.argv.findIndex(a => a === `--${name}`)
  if (ix >= 0) return process.argv[ix + 1]
  return def
}

async function main() {
  const host = process.env.HOST || 'http://localhost:3000'
  const projectId = arg('projectId', 'demo-001')!
  const noLLM = process.argv.includes('--no-llm')
  const debug = process.argv.includes('--debug')
  const dryRun = process.argv.includes('--dryRun')
  const noVisuals = process.argv.includes('--noVisuals')
  const noTTS = process.argv.includes('--noTTS')
  const noMusic = process.argv.includes('--noMusic')
  const noSfx = process.argv.includes('--noSfx')
  const noUpload = process.argv.includes('--noUpload')
  const noFinal = process.argv.includes('--noFinal')

  if (!noLLM) {
    const plan = await fetch(`${host}/api/pipeline/control`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Test story', targetSec: 60, projectId, strict: false, debug: !!debug }) }).then(r => r.json())
    if (!plan?.ok) { console.error('control failed', plan); process.exit(1) }
    console.log('[smoke] control ok', { validation: plan.validation })
  }

  const render = await fetch(`${host}/api/render`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, debug: !!debug, dryRun: !!dryRun, noVisuals, noTTS, noMusic, noSfx, noUpload, noFinal })
  }).then(r => r.json())
  if (!render?.ok) { console.error('render failed', render); process.exit(2) }
  console.log('[smoke] render ok', { dryRun: render.dryRun, haveFinal: !!render.finalUrl })
}

main().catch((e) => { console.error(e); process.exit(3) })


