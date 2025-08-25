import { uploadFile } from '../server/supaUpload'

(async () => {
  const url = await uploadFile('hls', 'test/hello.txt', __filename, 60)
  console.log('Public URL:', url)
})().catch((e) => { console.error(e); process.exit(1) })


