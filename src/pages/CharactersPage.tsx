import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, ImagePlus, X } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { Character, Project } from '../types'
import { loadProjects, saveProject } from '../store'

export default function CharactersPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProjects().then(projs => {
      setProjects(projs)
      if (projs.length > 0) setSelectedProjectId(projs[0].id)
    })
  }, [])

  const currentProject = projects.find(p => p.id === selectedProjectId)
  const characters = currentProject?.characters || []

  async function updateCurrentProject(updated: Project) {
    updated.updatedAt = Date.now()
    await saveProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  function addCharacter() {
    if (!currentProject) return
    const newChar: Character = {
      id: uuid(),
      name: '新角色',
      description: '',
      descriptionCn: '',
      referenceImage: '',
      voiceNotes: '',
    }
    setEditingChar(newChar)
  }

  async function saveCharacter(char: Character) {
    if (!currentProject) return
    const exists = currentProject.characters.find(c => c.id === char.id)
    const newChars = exists
      ? currentProject.characters.map(c => c.id === char.id ? char : c)
      : [...currentProject.characters, char]
    await updateCurrentProject({ ...currentProject, characters: newChars })
    setEditingChar(null)
  }

  async function deleteCharacter(id: string) {
    if (!currentProject) return
    const newChars = currentProject.characters.filter(c => c.id !== id)
    await updateCurrentProject({ ...currentProject, characters: newChars })
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

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>请先创建一个项目</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">角色库</h2>
          <p className="text-gray-500 text-sm mt-1">管理角色的外貌描述和参考图</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={addCharacter}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            添加角色
          </button>
        </div>
      </div>

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
                  className="w-28 h-28 rounded-lg bg-[#0f0f13] border border-[#2a2a35] flex items-center justify-center cursor-pointer hover:border-purple-500/50 overflow-hidden shrink-0"
                >
                  {editingChar.referenceImage ? (
                    <img src={editingChar.referenceImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">角色名称</label>
                  <input
                    value={editingChar.name}
                    onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
                    className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
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
                  placeholder="详细描述角色外貌..."
                  rows={3}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">中文备注</label>
                <textarea
                  value={editingChar.descriptionCn}
                  onChange={e => setEditingChar({ ...editingChar, descriptionCn: e.target.value })}
                  placeholder="角色的中文描述备注..."
                  rows={2}
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">音色备注</label>
                <input
                  value={editingChar.voiceNotes}
                  onChange={e => setEditingChar({ ...editingChar, voiceNotes: e.target.value })}
                  placeholder="e.g., 低沉成熟男声 / ElevenLabs voice ID: xxx"
                  className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
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
                onClick={() => saveCharacter(editingChar)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
              >
                保存角色
              </button>
            </div>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>还没有角色，点击「添加角色」开始创建</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(char => (
            <div
              key={char.id}
              className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg overflow-hidden hover:border-purple-500/30 transition-colors"
            >
              <div className="h-40 bg-[#0f0f13] flex items-center justify-center">
                {char.referenceImage ? (
                  <img src={char.referenceImage} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-10 h-10 text-gray-700" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{char.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingChar({ ...char })}
                      className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteCharacter(char.id)}
                      className="p-1 text-gray-600 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {char.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-1">{char.description}</p>
                )}
                {char.voiceNotes && (
                  <p className="text-xs text-gray-600">🎙 {char.voiceNotes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
