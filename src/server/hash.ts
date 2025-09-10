import crypto from 'node:crypto'
import fs from 'fs-extra'

export function semanticHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function sha256File(localPath: string): Promise<string> {
  const h = crypto.createHash('sha256')
  const s = fs.createReadStream(localPath)
  return await new Promise((resolve, reject) => {
    s.on('data', (d) => h.update(d))
    s.on('error', reject)
    s.on('end', () => resolve(h.digest('hex')))
  })
}


