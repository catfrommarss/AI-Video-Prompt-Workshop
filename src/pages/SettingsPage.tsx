import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'
import type { AppSettings } from '../types'
import { loadSettings, saveSettings } from '../store'

const POPULAR_MODELS = [
  // Anthropic
  'anthropic/claude-opus-4.5',
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  // OpenAI
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'openai/gpt-4.1-nano',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/o3',
  'openai/o4-mini',
  // Google
  'google/gemini-2.5-pro-preview',
  'google/gemini-2.5-flash-preview',
  'google/gemini-2.0-flash-001',
  // DeepSeek
  'deepseek/deepseek-chat-v3-0324',
  'deepseek/deepseek-r1',
  // Meta
  'meta-llama/llama-4-maverick',
  'meta-llama/llama-4-scout',
  // Qwen
  'qwen/qwen3-235b-a22b',
  'qwen/qwen3-30b-a3b',
  // xAI
  'x-ai/grok-3',
  'x-ai/grok-3-mini',
  // Mistral
  'mistralai/mistral-large-2411',
  'mistralai/mistral-medium-3',
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings())
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">设置</h2>
      <p className="text-gray-500 text-sm mb-8">配置 OpenRouter API 和模型选择</p>

      <div className="space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">OpenRouter API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-or-..."
              className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            从 openrouter.ai 获取 API Key，数据仅存储在本地浏览器中
          </p>
        </div>

        {/* Model selection */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">模型选择</label>
          <select
            value={settings.apiModel}
            onChange={e => setSettings({ ...settings, apiModel: e.target.value })}
            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {POPULAR_MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1">
            也可以在下方手动输入其他 OpenRouter 支持的模型 ID
          </p>
          <input
            value={settings.apiModel}
            onChange={e => setSettings({ ...settings, apiModel: e.target.value })}
            placeholder="手动输入模型 ID..."
            className="w-full mt-2 bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Custom prompt */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">自定义提示词（可选）</label>
          <textarea
            value={settings.customPrompt}
            onChange={e => setSettings({ ...settings, customPrompt: e.target.value })}
            placeholder="添加额外的指令，例如：镜头风格偏好、特定的视觉风格要求..."
            rows={4}
            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {saved ? '已保存!' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
