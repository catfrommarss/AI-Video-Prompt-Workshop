import { NavLink, Outlet } from 'react-router-dom'
import { Film, Users, Settings, FolderOpen } from 'lucide-react'

const navItems = [
  { to: '/', icon: FolderOpen, label: '项目' },
  { to: '/characters', icon: Users, label: '角色库' },
  { to: '/shots', icon: Film, label: '分镜' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#0f0f13]">
      {/* Sidebar */}
      <nav className="w-56 bg-[#16161d] border-r border-[#2a2a35] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#2a2a35]">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            StoryBoard AI
          </h1>
          <p className="text-xs text-gray-500 mt-1">Seedance Prompt 生成器</p>
        </div>
        <div className="flex-1 py-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-purple-400 bg-purple-500/10 border-r-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
