import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Clock, ChevronRight, Film } from 'lucide-react'
import type { Project } from '../types'
import { loadProjects, saveProject, deleteProject, createProject } from '../store'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    const proj = createProject(newName.trim())
    await saveProject(proj)
    setProjects([proj, ...projects])
    setNewName('')
    setShowNew(false)
    navigate(`/project/${proj.id}`)
  }

  async function handleDelete(id: string) {
    await deleteProject(id)
    setProjects(projects.filter(p => p.id !== id))
  }

  function openProject(id: string) {
    navigate(`/project/${id}`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">项目列表</h2>
          <p className="text-gray-500 text-sm mt-1">管理你的故事分镜项目</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {showNew && (
        <div className="mb-6 p-4 bg-[#1a1a24] rounded-lg border border-[#2a2a35]">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="输入项目名称..."
            className="w-full bg-[#0f0f13] border border-[#2a2a35] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
            >
              创建
            </button>
            <button
              onClick={() => { setShowNew(false); setNewName('') }}
              className="px-4 py-1.5 bg-[#2a2a35] text-gray-400 rounded-lg text-sm hover:bg-[#35354a]"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showNew ? (
        <div className="text-center py-20 text-gray-500">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>还没有项目，点击「新建项目」开始</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => openProject(proj.id)}
              className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg border border-[#2a2a35] hover:border-purple-500/50 cursor-pointer transition-colors group"
            >
              <div>
                <h3 className="text-white font-medium">{proj.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                  <span>{proj.characters.length} 角色</span>
                  <span>{proj.shots.length} 镜头</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(proj.id) }}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
