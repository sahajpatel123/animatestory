export async function register() {
  if ((global as any).__instrumentationInstalled) return
  process.on('unhandledRejection', (e: any) => {
    // eslint-disable-next-line no-console
    console.error('[unhandledRejection]', e?.stack || e)
  })
  process.on('uncaughtException', (e: any) => {
    // eslint-disable-next-line no-console
    console.error('[uncaughtException]', e?.stack || e)
  })
  ;(global as any).__instrumentationInstalled = true
}
