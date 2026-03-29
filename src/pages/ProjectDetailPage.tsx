import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, Loader2, Copy, Download, ChevronDown, ChevronUp, Edit3, Check, Mic, Camera, Clock, Users, Trash2, ImagePlus, X } from 'lucide-react'
import type { Project, Shot, Character } from '../types'
import { loadProjects, saveProject, loadSettings } from '../store'
import { analyzeStory, extractCharacters } from '../api'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [expandedShot, setExpandedShot] = useState<string | null>(null)
  const [editingShotId, setEditingShotId] = useState<string | null>(null)
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProjects().then(projects => {
      const found = projects.find(p => p.id === id)
      if (found) {
        setProject(found)
        setStory(found.story)
      }
    })
  }, [id])

  if (!project) {
    return (
      <div className="p-8 text-center text-gray-500">
        项目不存在
        <button onClick={() => navigate('/')} className="ml-2 text-purple-400 hover:underline">返回</button>
      </div>
    )
  }

  async function updateProject(updated: Project) {
    updated.updatedAt = Date.now()
    await saveProject(updated)
    setProject(updated)
  }

  async function handleExtractCharacters() {
    if (!story.trim()) return
    const settings = loadSettings()
    if (!settings.apiKey) {
      setError('请先在设置页面配置 OpenRouter API Key')
      return
    }

    setExtracting(true)
    setError('')
    try {
      await updateProject({ ...project!, story })
      const chars = await extractCharacters(settings, story)
      const existing = project!.characters
      const merged = [...existing]
      for (const c of chars) {
        if (!existing.find(e => e.name === c.name)) {
          merged.push(c)
        }
      }
      await updateProject({ ...project!, story, characters: merged })
    } catch (err: any) {
      setError(err.message || '角色提取失败，请检查 API 配置')
    } finally {
      setExtracting(false)
    }
  }

  async function handleGenerate() {
    if (!story.trim()) return
    const settings = loadSettings()
    if (!settings.apiKey) {
      setError('请先在设置页面配置 OpenRouter API Key')
      return
    }

    setLoading(true)
    setError('')
    try {
      await updateProject({ ...project!, story })
      const shots = await analyzeStory(settings, story, project!.characters)
      await updateProject({ ...project!, story, shots })
    } catch (err: any) {
      setError(err.message || '生成失败，请检查 API 配置')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCharacter(charId: string) {
    const newChars = project!.characters.filter(c => c.id !== charId)
    await updateProject({ ...project!, characters: newChars })
  }

  async function saveCharacterEdit(char: Character) {
    const exists = project!.characters.find(c => c.id === char.id)
    const newChars = exists
      ? project!.characters.map(c => c.id === char.id ? char : c)
      : [...project!.characters, char]
    await updateProject({ ...project!, characters: newChars })
    setEditingChar(null)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editingChar || !e.target.files?.[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      setEditingChar({ ...editingChar, referenceImage: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  async function updateShot(shotId: string, updates: Partial<Shot>) {
    const newShots = project!.shots.map(s =>
      s.id === shotId ? { ...s, ...updates } : s
    )
    await updateProject({ ...project!, shots: newShots })
  }

  function getCharacterName(charId: string) {
    return project!.characters.find(c => c.id === charId)?.name || charId
  }

  function copyAllPrompts() {
    const text = project!.shots
      .map(s => `--- Shot ${s.shotNumber}: ${s.sceneName} ---\n${s.prompt}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
  }

  function exportDialogues() {
    const lines = project!.shots
      .map(s => {
        const parts = [`[镜头 ${s.shotNumber}] ${s.sceneName} | 运镜: ${s.cameraMovement} | 时长: ${s.duration}s`]
        if (s.dialogue) parts.push(`  对白 - ${s.dialogueSpeaker}: "${s.dialogue}" (${s.emotion})`)
        if (s.narration) parts.push(`  旁白: ${s.narration}`)
        if (!s.dialogue && !s.narration) parts.push(`  （无对白/旁白）`)
        return parts.join('\n')
      })
      .join('\n\n')
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project!.name}-对白列表.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportFullScript() {
    const totalDuration = project!.shots.reduce((sum, s) => sum + s.duration, 0)
    const header = `项目: ${project!.name}\n总镜头数: ${project!.shots.length}\n预估总时长: ${totalDuration}s (${(totalDuration / 60).toFixed(1)}min)\n${'='.repeat(60)}\n\n`

    const lines = project!.shots
      .map(s => {
        const parts = [
          `【镜头 ${s.shotNumber}】${s.sceneName}`,
          `描述: ${s.description}`,
          `运镜: ${s.cameraMovement} | 时长: ${s.duration}s`,
          `Prompt: ${s.prompt}`,
        ]
        if (s.dialogue) parts.push(`对白 - ${s.dialogueSpeaker}: "${s.dialogue}" (${s.emotion})`)
        if (s.narration) parts.push(`旁白: ${s.narration}`)
        parts.push('-'.repeat(60))
        return parts.join('\n')
      })
      .join('\n\n')

    const blob = new Blob([header + lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project!.name}-完整分镜脚本.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPrompts() {
    const text = project!.shots
      .map(s => `=== 镜头 ${s.shotNumber}: ${s.sceneName} ===\n运镜: ${s.cameraMovement}\n时长: ${s.duration}s\n\n${s.prompt}\n`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project!.name}-Prompts.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{project.name}</h2>
          <p className="text-gray-500 text-sm">
            {project.characters.length} 角色 · {project.shots.length} 镜头
          </p>
        </div>
      </div>

      {/* Story input */}
      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-2">故事 / 剧本</label>
        <textarea
          value={story}
          onChange={e => setStory(e.target.value)}
          placeholder="在这里输入你的故事或剧本内容...&#10;&#10;可以是小说片段、剧本、场景描述，AI 会自动分析并拆分成镜头。"
          rows={10}
          className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-4 py-3 text-white text-sm leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={handleExtractCharacters}
            disabled={extracting || !story.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {extracting ? '提取中...' : '① 提取角色'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !story.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? '生成中...' : '② 生成分镜'}
          </button>
          {project.shots.length > 0 && (
            <>
              <button onClick={copyAllPrompts} className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white text-sm border border-[#2a2a35] rounded-lg hover:border-purple-500/50">
                <Copy className="w-3.5 h-3.5" />
                复制全部 Prompt
              </button>
              <button onClick={exportPrompts} className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white text-sm border border-[#2a2a35] rounded-lg hover:border-purple-500/50">
                <Download className="w-3.5 h-3.5" />
                导出 Prompt
              </button>
              <button onClick={exportDialogues} className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white text-sm border border-[#2a2a35] rounded-lg hover:border-purple-500/50">
                <Download className="w-3.5 h-3.5" />
                导出对白
              </button>
              <button onClick={exportFullScript} className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white text-sm border border-[#2a2a35] rounded-lg hover:border-purple-500/50">
                <Download className="w-3.5 h-3.5" />
                导出完整脚本
              </button>
            </>
          )}
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Characters section */}
      {project.characters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            角色列表
            <span className="text-sm text-gray-500 font-normal">（点击角色可编辑，修改后再生成分镜）</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.characters.map(char => (
              <div
                key={char.id}
                className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg p-3 hover:border-teal-500/30 transition-colors group"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-[#0f0f13] border border-[#2a2a35] flex items-center justify-center overflow-hidden shrink-0">
                    {char.referenceImage ? (
                      <img src={char.referenceImage} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium text-sm">{char.name}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingChar({ ...char })}
                          className="text-xs text-teal-400 hover:text-teal-300 px-2 py-0.5"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteCharacter(char.id)}
                          className="p-0.5 text-gray-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {char.descriptionCn && (
                      <p className="text-xs text-gray-500 mt-0.5">{char.descriptionCn}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{char.description}</p>
                    {char.voiceNotes && (
                      <p className="text-xs text-gray-600 mt-1">🎙 {char.voiceNotes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character edit modal */}
      {editingChar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a35]">
              <h3 className="text-lg font-bold text-white">编辑角色</h3>
              <button onClick={() => setEditingChar(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-lg bg-[#0f0f13] border border-[#2a2a35] flex items-center justify-center cursor-pointer hover:border-teal-500/50 overflow-hidden shrink-0"
                >
                  {editingChar.referenceImage ? (
                    <img src={editingChar.referenceImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus className="w-8 h-8 text-gray-600 mx-auto" />
                      <span className="text-xs text-gray-600 mt-1 block">上传参考图</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">角色名称</label>
                    <input
                      value={editingChar.name}
                      onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
                      className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">角色简介</label>
                    <input
                      value={editingChar.descriptionCn}
                      onChange={e => setEditingChar({ ...editingChar, descriptionCn: e.target.value })}
                      placeholder="角色的身份、性格..."
                      className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  外貌描述
                  <span className="text-gray-600 ml-2">* 会自动注入到每个镜头的 prompt 中</span>
                </label>
                <textarea
                  value={editingChar.description}
                  onChange={e => setEditingChar({ ...editingChar, description: e.target.value })}
                  placeholder="详细描述角色外貌：年龄、体型、发型、服装、气质等..."
                  rows={4}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">音色备注</label>
                <input
                  value={editingChar.voiceNotes}
                  onChange={e => setEditingChar({ ...editingChar, voiceNotes: e.target.value })}
                  placeholder="如：低沉成熟男声 / 清脆少女音..."
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-[#2a2a35]">
              <button
                onClick={() => setEditingChar(null)}
                className="px-4 py-2 bg-[#2a2a35] text-gray-400 rounded-lg text-sm hover:bg-[#35354a]"
              >
                取消
              </button>
              <button
                onClick={() => saveCharacterEdit(editingChar)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-500"
              >
                保存角色
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shots list */}
      {project.shots.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white mb-4">分镜列表</h3>
          {project.shots.map(shot => (
            <ShotCard
              key={shot.id}
              shot={shot}
              expanded={expandedShot === shot.id}
              editing={editingShotId === shot.id}
              onToggle={() => setExpandedShot(expandedShot === shot.id ? null : shot.id)}
              onEdit={() => setEditingShotId(editingShotId === shot.id ? null : shot.id)}
              onUpdate={(updates) => updateShot(shot.id, updates)}
              getCharacterName={getCharacterName}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ShotCard({
  shot,
  expanded,
  editing,
  onToggle,
  onEdit,
  onUpdate,
  getCharacterName,
}: {
  shot: Shot
  expanded: boolean
  editing: boolean
  onToggle: () => void
  onEdit: () => void
  onUpdate: (updates: Partial<Shot>) => void
  getCharacterName: (id: string) => string
}) {
  function copyPrompt() {
    navigator.clipboard.writeText(shot.prompt)
  }

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg overflow-hidden">
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center text-sm font-bold">
            {shot.shotNumber}
          </span>
          <div>
            <span className="text-white text-sm font-medium">{shot.sceneName}</span>
            <p className="text-gray-500 text-xs mt-0.5">{shot.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Camera className="w-3 h-3" />
            {shot.cameraMovement}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {shot.duration}s
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#2a2a35] pt-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Prompt</label>
              <div className="flex gap-2">
                <button onClick={copyPrompt} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <Copy className="w-3 h-3" /> 复制
                </button>
                <button onClick={onEdit} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  {editing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                  {editing ? '完成' : '编辑'}
                </button>
              </div>
            </div>
            {editing ? (
              <textarea
                value={shot.prompt}
                onChange={e => onUpdate({ prompt: e.target.value })}
                rows={4}
                className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-300 bg-[#0f0f13] rounded-lg p-3 leading-relaxed">{shot.prompt}</p>
            )}
          </div>

          {(shot.dialogue || editing) && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Mic className="w-3 h-3" /> 对白
              </label>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={shot.dialogueSpeaker}
                    onChange={e => onUpdate({ dialogueSpeaker: e.target.value })}
                    placeholder="说话人"
                    className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  <textarea
                    value={shot.dialogue}
                    onChange={e => onUpdate({ dialogue: e.target.value })}
                    placeholder="对白内容"
                    rows={2}
                    className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <input
                    value={shot.emotion}
                    onChange={e => onUpdate({ emotion: e.target.value })}
                    placeholder="情绪/语气"
                    className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="bg-[#0f0f13] rounded-lg p-3 text-sm">
                  <span className="text-purple-400">{shot.dialogueSpeaker}:</span>
                  <span className="text-gray-300 ml-2">"{shot.dialogue}"</span>
                  {shot.emotion && <span className="text-gray-500 ml-2">({shot.emotion})</span>}
                </div>
              )}
            </div>
          )}

          {(shot.narration || editing) && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">旁白</label>
              {editing ? (
                <textarea
                  value={shot.narration}
                  onChange={e => onUpdate({ narration: e.target.value })}
                  placeholder="旁白内容"
                  rows={2}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-400 italic bg-[#0f0f13] rounded-lg p-3">{shot.narration}</p>
              )}
            </div>
          )}

          {shot.characters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">出场角色:</span>
              {shot.characters.map(cid => (
                <span key={cid} className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
                  {getCharacterName(cid)}
                </span>
              ))}
            </div>
          )}

          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">运镜</label>
                <input
                  value={shot.cameraMovement}
                  onChange={e => onUpdate({ cameraMovement: e.target.value })}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">时长 (秒)</label>
                <input
                  type="number"
                  value={shot.duration}
                  onChange={e => onUpdate({ duration: Number(e.target.value) })}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
