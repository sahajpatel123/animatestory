import { z } from 'zod'

export const promptSchema = z.string().min(8).max(800)

const banned = [
  /child sexual/i,
  /extremist/i,
  /terror/i,
  /hate\s*speech/i,
  /illegal\s*drugs/i,
  /explicit\s*sexual/i,
  /graphic\s*violence/i,
]

export function isPromptSafe(prompt: string): boolean {
  if (!promptSchema.safeParse(prompt).success) return false
  return !banned.some((r) => r.test(prompt))
}


