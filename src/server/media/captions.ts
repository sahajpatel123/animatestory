import fs from 'fs-extra'

export type Line = { id: string; who: string; text: string; estMs: number }

function toTS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const msRem = Math.max(0, ms % 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(msRem, 3)}`
}

export async function writeSrt(lines: Line[], outPath: string, totalMs: number) {
  let cur = 0
  const blocks: string[] = []
  let i = 1
  for (const ln of lines) {
    const start = cur
    const end = Math.min(totalMs, cur + (ln.estMs || 0))
    const capped = (ln.text || '').trim().slice(0, 84)
    blocks.push(`${i++}\n${toTS(start)} --> ${toTS(end)}\n${capped}\n`)
    cur = end + 10
  }
  await fs.outputFile(outPath, blocks.join('\n'))
}


