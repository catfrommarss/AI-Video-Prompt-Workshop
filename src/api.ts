import type { AppSettings, Character, Shot } from './types'
import { v4 as uuid } from 'uuid'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'

async function callLLM(settings: AppSettings, messages: { role: string; content: string }[]) {
  const res = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.apiModel,
      messages,
      temperature: 0.7,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API Error (${res.status}): ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

const SYSTEM_PROMPT = `你是一位专业的电影导演和编剧助手。你的任务是分析故事，将其拆分为详细的分镜，用于 Seedance AI 视频生成。

你需要为每个镜头提供：
1. 镜头编号
2. 场景名称
3. 镜头描述（简要说明发生了什么）
4. 详细的中文视频生成 prompt（包含画面细节、光线、氛围、镜头角度，为 Seedance 优化）
5. 运镜方式（如：固定镜头、左摇、推进、升降、跟踪等）
6. 建议时长（每个镜头 4-10 秒）
7. 该镜头的对白内容（如有）
8. 对白说话人
9. 对白的情绪/语气（如：平静、愤怒、低语、兴奋）
10. 旁白内容（如有）

重要规则：
- 每个镜头应为 4-10 秒的视频
- 保持同一场景中相邻镜头的视觉连续性
- 当角色出场时，必须在 prompt 中包含其完整的外貌描述
- 使用电影化的语言描述 prompt：光线、色调、镜头类型、景深
- prompt 必须使用中文，为 Seedance AI 视频生成优化
- prompt 要简洁但视觉描述精确

你必须以有效 JSON 格式回复，格式如下：
{
  "shots": [
    {
      "shotNumber": 1,
      "sceneName": "场景名称",
      "description": "镜头描述",
      "prompt": "Seedance 中文视频生成 prompt",
      "cameraMovement": "运镜方式",
      "duration": 6,
      "dialogue": "对白内容",
      "dialogueSpeaker": "说话人",
      "emotion": "情绪/语气",
      "narration": "旁白内容",
      "characterNames": ["出场角色名"]
    }
  ]
}`

const CHARACTER_EXTRACT_PROMPT = `你是一位专业的编剧助手。你的任务是从故事中提取所有角色，并为每个角色生成详细的外貌描述，用于 AI 视频生成。

你需要为每个角色提供：
1. name: 角色名称
2. description: 详细的外貌描述（中文，包含年龄、体型、发型、服装、气质等，要足够具体以保证视频生成时角色一致性）
3. descriptionCn: 简短的角色介绍（身份、性格特点）
4. voiceNotes: 音色建议（如：低沉成熟男声、清脆少女音、沙哑老者声等）

重要规则：
- 外貌描述要非常具体，避免模糊用词
- 如果故事中没有明确描述外貌，请根据角色性格和身份合理推断
- 描述要适合 AI 视频生成，重点关注视觉特征

你必须以有效 JSON 格式回复：
{
  "characters": [
    {
      "name": "角色名",
      "description": "详细外貌描述",
      "descriptionCn": "角色简介",
      "voiceNotes": "音色建议"
    }
  ]
}`

export async function extractCharacters(
  settings: AppSettings,
  story: string
): Promise<Character[]> {
  const content = await callLLM(settings, [
    { role: 'system', content: CHARACTER_EXTRACT_PROMPT },
    { role: 'user', content: `请从以下故事中提取所有角色：\n\n${story}` },
  ])

  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  const parsed = JSON.parse(jsonStr.trim())
  return parsed.characters.map((c: any) => ({
    id: uuid(),
    name: c.name || '',
    description: c.description || '',
    descriptionCn: c.descriptionCn || '',
    referenceImage: '',
    voiceNotes: c.voiceNotes || '',
  }))
}

export async function analyzeStory(
  settings: AppSettings,
  story: string,
  characters: Character[]
): Promise<Shot[]> {
  const characterContext = characters.length > 0
    ? `\n\n以下是角色及其固定外貌描述，当角色出场时你必须使用这些描述：\n${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
    : ''

  const userPrompt = `请分析以下故事，将其拆分为适合 Seedance AI 视频生成的分镜。${characterContext}

故事内容：
${story}`

  const systemPrompt = settings.customPrompt
    ? `${SYSTEM_PROMPT}\n\n用户的额外要求：\n${settings.customPrompt}`
    : SYSTEM_PROMPT

  const content = await callLLM(settings, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  const parsed = JSON.parse(jsonStr.trim())
  const shots: Shot[] = parsed.shots.map((s: any) => {
    // Match character names to IDs
    const charIds = (s.characterNames || [])
      .map((name: string) => {
        const found = characters.find(
          c => c.name.toLowerCase() === name.toLowerCase()
        )
        return found?.id
      })
      .filter(Boolean)

    return {
      id: uuid(),
      shotNumber: s.shotNumber,
      sceneName: s.sceneName || '',
      description: s.description || '',
      prompt: s.prompt || '',
      cameraMovement: s.cameraMovement || 'static',
      duration: s.duration || 6,
      dialogue: s.dialogue || '',
      dialogueSpeaker: s.dialogueSpeaker || '',
      emotion: s.emotion || '',
      narration: s.narration || '',
      characters: charIds,
    }
  })

  return shots
}
