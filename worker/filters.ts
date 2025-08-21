export function kenBurnsFilter(seconds: number, fps: number, pan?: {from:[number,number];to:[number,number]}, zoom?: {from:number;to:number}) {
  const frames = Math.round(seconds * fps)
  const zFrom = zoom?.from ?? 1.0
  const zTo = zoom?.to ?? 1.08
  const zInc = (zTo - zFrom) / frames
  // Simple horizontal pan formula around center
  const xFrom = (pan?.from?.[0] ?? 0.5)
  const xTo = (pan?.to?.[0] ?? 0.5)
  const xExpr = `iw*(${xFrom} + (${xTo}-${xFrom})*on/${frames}) - iw*0.5`
  const yExpr = `ih*0.5` // fixed vertical center for simplicity
  const filter = `scale=1920:1080,zoompan=z='min(zoom+${zInc.toFixed(6)},${zTo.toFixed(3)})':x='${xExpr}':y='${yExpr}':d=${frames}:s=1920x1080,format=yuv420p`
  return { filter, frames }
}

export function srtFromCaptions(captions: Array<{ startMs: number; endMs: number; text: string }>) {
  const toTS = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const msRem = ms % 1000
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number, l=2) => String(n).padStart(l,'0')
    return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(msRem,3)}`
  }
  return captions.map((c, i) => `${i+1}\n${toTS(c.startMs)} --> ${toTS(c.endMs)}\n${c.text}\n`).join('\n')
}


