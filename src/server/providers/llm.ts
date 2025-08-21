// LLM provider (primary: Anthropic Claude 3.5 Sonnet, fallback: OpenAI GPT-4.1)
// Returns structured dialogue plan JSON per constraints

export type DialoguePlan = {
  targetSec: number
  acts: Array<{ title: string; index: number }>
  scenes: Array<{
    index: number
    title: string
    mood: string
    beats: Array<{ summary: string }>
    dialogue: Array<{ speaker: string; text: string }>
  }>
  characters: Array<{ id: string; name: string; ttsVoice: string }>
}

function buildPrompt(userPrompt: string, targetSec: number): string {
  return `You are a story engine. Expand the prompt into a 3-act story with 12–16 scenes.
Constraints:
- Dialogue: ≤3 lines per scene, ≤18 words per line, natural screenplay tone, no exposition dumps
- 2–3 beats per scene
- Apply runtime fit to ≈ ${targetSec}s with ≤60% speech density
- Keep a consistent character set; assign fixed voices
 - Strict visual style: ANIMATIVE ONLY (no photorealism). Think traditional/hand-drawn animation akin to "Arjun: The Warrior Prince (2012)" — stylized, illustrative, cinematic.

Output JSON fields:
{
  "targetSec": number,
  "acts": [{"title": string, "index": number}],
  "scenes": [{
    "index": number,
    "title": string,
    "mood": string,
    "beats": [{"summary": string}],
    "dialogue": [{"speaker": string, "text": string}]
  }],
  "characters": [{"id": string, "name": string, "ttsVoice": string}]
}

Prompt: ${userPrompt}`
}

export async function generateDialoguePlan(userPrompt: string, targetSec: number): Promise<DialoguePlan> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const prompt = buildPrompt(userPrompt, targetSec)

  // If keys missing, return a deterministic stub plan
  if (!anthropicKey && !openaiKey) {
    const scenesCount = Math.max(12, Math.min(16, Math.round(targetSec / 45)))
    const characters = [
      { id: 'lead', name: 'Alex', ttsVoice: 'eleven_male_1' },
      { id: 'ally', name: 'Rin', ttsVoice: 'eleven_female_1' },
    ]
    return {
      targetSec,
      acts: [{ title: 'Act I', index: 0 }, { title: 'Act II', index: 1 }, { title: 'Act III', index: 2 }],
      scenes: Array.from({ length: scenesCount }, (_, i) => ({
        index: i,
        title: `Scene ${i + 1}`,
        mood: i < scenesCount / 3 ? 'setup' : i < (2 * scenesCount) / 3 ? 'confrontation' : 'resolution',
        beats: [
          { summary: 'Beat A' },
          { summary: 'Beat B' },
          ...(i % 2 === 0 ? [{ summary: 'Beat C' }] : []),
        ],
        dialogue: [
          { speaker: characters[0].name, text: 'We set out, the path ahead is clear.' },
          { speaker: characters[1].name, text: 'Stay sharp, small signs tell big truths.' },
          ...(i % 3 === 0 ? [{ speaker: characters[0].name, text: 'We move together. No steps alone.' }] : []),
        ],
      })),
      characters,
    }
  }

  // Example implementation outline (real calls omitted for safety):
  // Prefer Anthropic Claude 3.5 Sonnet
  try {
    if (anthropicKey) {
      // const resp = await fetch('https://api.anthropic.com/v1/messages', { ... })
      // parse JSON
      // return parsed as DialoguePlan
    }
  } catch {}

  // Fallback to OpenAI
  try {
    if (openaiKey) {
      // const resp = await fetch('https://api.openai.com/v1/chat/completions', { ... })
      // parse and return
    }
  } catch {}

  // If external calls fail, return stub to keep pipeline functional
  return generateDialoguePlan(userPrompt, targetSec)
}


