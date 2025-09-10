import type { NextApiResponse } from 'next'

export function fail(res: NextApiResponse, status: number, code: string, error: unknown, ctx: Record<string, any> = {}) {
  const msg = (error instanceof Error ? error.message : String(error))
  const body = { ok: false, code, error: msg, ctx }
  if (process.env.LOG_LEVEL === 'debug' || process.env.DEBUG === '1') {
    console.error(`[${new Date().toISOString()}] FAIL`, JSON.stringify(body))
  }
  res.status(status).json(body)
}


