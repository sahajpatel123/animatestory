import fs from 'fs/promises'
import { uploadFileGCS } from '../server/gcsUpload'

;(async () => {
  await fs.writeFile('/tmp/hello.txt', 'hello world')
  const url = await uploadFileGCS('assets/demo1/hello.txt', '/tmp/hello.txt', 60)
  console.log('Uploaded:', url)
})().catch((e) => { console.error(e); process.exit(1) })


