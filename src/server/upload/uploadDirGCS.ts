import path from 'node:path'
import fs from 'fs-extra'
import { uploadFileGCS } from '@/server/gcsUpload'

export async function uploadDirGCS(localDir: string, bucketPrefix: string, cache = 31536000) {
  const files: string[] = []
  const walk = async (dir: string) => {
    const entries = await fs.readdir(dir)
    for (const e of entries) {
      const p = path.join(dir, e)
      const st = await fs.stat(p)
      if (st.isDirectory()) await walk(p)
      else files.push(p)
    }
  }
  await walk(localDir)
  const uploaded: string[] = []
  for (const file of files) {
    const rel = path.relative(localDir, file)
    const key = path.join(bucketPrefix, rel).replace(/\\/g, '/')
    const url = await uploadFileGCS(key, file, cache)
    uploaded.push(url)
  }
  return uploaded
}


