'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface User {
  id: string
  nickname: string
  planetNumber: string
  role: string
  skillLevel: string
  email: string | null
  avatar: string | null
}

interface Project {
  id: string
  title: string
  description: string | null
  type: 'LINK' | 'HTML_FILE'
  projectUrl: string | null
  htmlFile: string | null
  coverImage: string
  voteCount: number
  isApproved: boolean
  bootcamp: {
    id: string
    name: string
  }
  _count: {
    votes: number
  }
}

const USER_ROLES = [
  { value: 'COACH', label: '教练' },
  { value: 'ACTIONIST', label: '行动家' },
  { value: 'MEMBER', label: '圈友' },
  { value: 'VOLUNTEER', label: '志愿者' },
  { value: 'STAFF', label: '工作人员' },
]

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: '🌱 零基础小白', description: '刚接触编程，充满学习热情' },
  { value: 'INTERMEDIATE', label: '💪 有一定基础', description: '掌握基本编程概念，希望提升技能' },
  { value: 'ADVANCED', label: '🚀 专业程序员', description: '具备丰富编程经验，追求技术深度' },
]

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'projects'>('info')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<User>>({})
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setEditData(parsedUser)
      fetchUserProjects(parsedUser.id)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  const fetchUserProjects = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching user projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setEditMode(false)
        toast.success('✅ 个人信息更新成功！')
      } else {
        toast.error('更新失败，请重试')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('网络错误，请稍后重试')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
        toast.success('🗑️ 作品删除成功！')
      } else {
        toast.error('删除失败，请重试')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('删除失败，请重试')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="hero-section py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {user.nickname}
            </h1>
            <p className="text-blue-100 text-lg">
              星球编号：{user.planetNumber} · {USER_ROLES.find(r => r.value === user.role)?.label}
            </p>
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'info'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                👤 个人信息
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'projects'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                📁 我的作品 ({projects.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'info' && (
          <div className="form-section">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">个人信息</h2>
              <div className="space-x-4">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="btn-primary"
                    >
                      ✅ 保存
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-primary"
                  >
                    ✏️ 编辑资料
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">昵称</label>
                {editMode ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editData.nickname || ''}
                    onChange={(e) => setEditData({...editData, nickname: e.target.value})}
                  />
                ) : (
                  <div className="form-input bg-gray-50">{user.nickname}</div>
                )}
              </div>

              <div>
                <label className="form-label">星球编号</label>
                <div className="form-input bg-gray-50">{user.planetNumber}</div>
              </div>

              <div>
                <label className="form-label">学员身份</label>
                {editMode ? (
                  <div className="select-wrapper">
                    <select
                      className="enhanced-select"
                      value={editData.role || ''}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                      onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                      onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                    >
                      {USER_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-input bg-gray-50">
                    {USER_ROLES.find(r => r.value === user.role)?.label}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">技术水平</label>
                {editMode ? (
                  <div className="select-wrapper">
                    <select
                      className="enhanced-select"
                      value={editData.skillLevel || ''}
                      onChange={(e) => setEditData({...editData, skillLevel: e.target.value})}
                      onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                      onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                    >
                      {SKILL_LEVELS.map(level => (
                        <option key={level.value} value={level.value} title={level.description}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-input bg-gray-50">
                    {SKILL_LEVELS.find(l => l.value === user.skillLevel)?.label || '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">邮箱</label>
                {editMode ? (
                  <input
                    type="email"
                    className="form-input"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                ) : (
                  <div className="form-input bg-gray-50">{user.email || '未设置'}</div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">账户操作</h3>
                  <p className="text-gray-600">管理你的账户设置</p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={logout}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    🚪 退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">我的作品</h2>
              <a href="/upload" className="btn-primary">
                ➕ 上传新作品
              </a>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="text-6xl mb-6">📝</div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">还没有作品</h3>
                <p className="text-gray-600 mb-8">快去上传你的第一个作品吧！</p>
                <a href="/upload" className="btn-primary">
                  ✨ 上传作品
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.map((project) => (
                  <div key={project.id} className="project-card">
                    {/* 封面图 */}
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-4 overflow-hidden">
                      {project.coverImage ? (
                        <img
                          src={project.coverImage}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">封面图</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-gray-900 flex-1">
                        {project.title}
                      </h4>
                      <div className="flex space-x-2">
                        <span className={`tag ${project.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {project.isApproved ? '✅ 已审核' : '⏳ 待审核'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.description || '暂无描述'}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{project.bootcamp.name}</span>
                      <span>❤️ {project.voteCount}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {project.type === 'LINK' && project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            🔗 查看
                          </a>
                        )}
                        {project.type === 'HTML_FILE' && project.htmlFile && (
                          <a
                            href={project.htmlFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            📄 预览
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-sm px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}