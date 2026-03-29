import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Camera, Clock, ChevronRight } from 'lucide-react'
import type { Project } from '../types'
import { loadProjects } from '../store'

export default function ShotsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  const projectsWithShots = projects.filter(p => p.shots.length > 0)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">分镜总览</h2>
      <p className="text-gray-500 text-sm mb-8">查看所有项目的分镜列表</p>

      {projectsWithShots.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>还没有生成任何分镜</p>
          <p className="text-sm mt-1">进入项目，输入故事后点击「生成分镜」</p>
        </div>
      ) : (
        <div className="space-y-8">
          {projectsWithShots.map(proj => (
            <div key={proj.id}>
              <div
                onClick={() => navigate(`/project/${proj.id}`)}
                className="flex items-center justify-between mb-3 cursor-pointer group"
              >
                <h3 className="text-lg font-medium text-white group-hover:text-purple-400 transition-colors">
                  {proj.name}
                  <span className="text-sm text-gray-500 ml-2">{proj.shots.length} 镜头</span>
                </h3>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {proj.shots.slice(0, 6).map(shot => (
                  <div
                    key={shot.id}
                    onClick={() => navigate(`/project/${proj.id}`)}
                    className="bg-[#1a1a24] border border-[#2a2a35] rounded-lg p-3 cursor-pointer hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                        {shot.shotNumber}
                      </span>
                      <span className="text-white text-sm font-medium truncate">{shot.sceneName}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{shot.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{shot.cameraMovement}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{shot.duration}s</span>
                    </div>
                  </div>
                ))}
              </div>
              {proj.shots.length > 6 && (
                <p
                  onClick={() => navigate(`/project/${proj.id}`)}
                  className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer mt-2"
                >
                  查看全部 {proj.shots.length} 个镜头 →
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
