export function traceId() { return Math.random().toString(36).slice(2,10); }
export const DEBUG = process.env.LOG_LEVEL === 'debug' || process.env.DEBUG === '1'
export function logJSON(label: string, obj: any) { console.log(`[${new Date().toISOString()}] ${label} ${JSON.stringify(obj)}`) }
