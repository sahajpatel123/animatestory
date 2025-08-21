export type AudioPlan = {
  voices: Array<{ character: string; tts: 'elevenlabs'|'openai'; voiceId: string }>
  sfx: Array<{ when: string; tag: string }>
  music: Array<{ act: number; mood: 'calm'|'tense'|'uplifting'; ref: string }>
  mix: { dialogueLUFS: string; musicDuckDb: number; finalLUFS: string }
}

export function buildAudioPlan(dialoguePlan: { targetSec: number; acts: any[]; scenes: any[]; characters: Array<{ name: string; ttsVoice: string }> }): AudioPlan {
  const voices = dialoguePlan.characters.map(c => ({ character: c.name, tts: 'elevenlabs' as const, voiceId: c.ttsVoice }))
  const sfx = [ { when: 'beats:environment', tag: 'forest' }, { when: 'beats:movement', tag: 'footsteps' } ]
  const music = [ { act: 0, mood: 'calm' as const, ref: 'theme_setup' }, { act: 1, mood: 'tense' as const, ref: 'theme_confront' }, { act: 2, mood: 'uplifting' as const, ref: 'theme_resolve' } ]
  return { voices, sfx, music, mix: { dialogueLUFS: '-12..-6', musicDuckDb: -10, finalLUFS: '-14' } }
}


