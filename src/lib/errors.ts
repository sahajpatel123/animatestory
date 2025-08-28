export function installGlobalErrorHandlers() {
  if ((global as any).__globalErrorHandlersInstalled) return
  process.on('unhandledRejection', (reason: any) => {
    // eslint-disable-next-line no-console
    console.error('[unhandledRejection]', reason?.stack || reason)
  })
  process.on('uncaughtException', (err: any) => {
    // eslint-disable-next-line no-console
    console.error('[uncaughtException]', err?.stack || err)
  })
  ;(global as any).__globalErrorHandlersInstalled = true
}
