import fs from 'fs-extra'
import path from 'node:path'

export async function downloadToFile(url: string, outPath: string) {
  await fs.ensureDir(path.dirname(outPath))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(outPath, buf)
  return outPath
}


