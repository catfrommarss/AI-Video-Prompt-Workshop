export interface Character {
  id: string
  name: string
  description: string // 固定外貌描述（英文）
  descriptionCn: string // 中文备注
  referenceImage: string // base64 or data URL
  voiceNotes: string // 音色备注
}

export interface Shot {
  id: string
  shotNumber: number
  sceneName: string
  description: string // 镜头描述（中文）
  prompt: string // Runway/VEO prompt（英文）
  cameraMovement: string // 运镜
  duration: number // 建议时长（秒）
  dialogue: string // 对白文本
  dialogueSpeaker: string // 说话人
  emotion: string // 情绪/语气
  narration: string // 旁白
  characters: string[] // 角色ID列表
}

export interface Project {
  id: string
  name: string
  story: string // 原始故事文本
  characters: Character[]
  shots: Shot[]
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  apiKey: string
  apiModel: string
  customPrompt: string // 自定义系统提示词
}
