'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Star, Target, BarChart3, Mail, Edit, Trash2, ExternalLink, Upload, Heart } from 'lucide-react'
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
  author?: {
    id: string
    nickname: string
    planetNumber: string
  }
  likedAt?: string | Date
  _count: {
    votes: number
  }
}

const USER_ROLES = [
  { value: 'ADMIN', label: '系统管理员' },
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
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'projects' | 'favorites'>('info')
  const [currentFavoritePage, setCurrentFavoritePage] = useState(1)
  const favoritesPerPage = 6
  const [totalFavorites, setTotalFavorites] = useState(0)
  const [totalFavoritePages, setTotalFavoritePages] = useState(0)
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
      // 确保 editData 包含默认值，特别是 skillLevel
      setEditData({
        ...parsedUser,
        skillLevel: parsedUser.skillLevel || 'BEGINNER' // 默认为初级
      })
      fetchUserProjects(parsedUser.id)
      fetchUserFavorites(parsedUser.id) // 页面加载时就获取喜欢的作品
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

  const fetchUserFavorites = async (userId: string, page: number = 1) => {
    setFavoritesLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/favorites?page=${page}&limit=${favoritesPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFavoriteProjects(data.projects)
        setTotalFavorites(data.totalCount)
        setTotalFavoritePages(data.totalPages)
      } else {
        console.error('Error fetching favorites:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      // 确保包含所有必要的字段，并设置默认值
      const updateData = {
        nickname: editData.nickname || user.nickname,
        role: editData.role || user.role,
        skillLevel: editData.skillLevel || 'BEGINNER',
        email: editData.email || user.email
      }

      console.log('Sending update data:', updateData)

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-3xl font-bold text-white">个人中心</h1>
            <div className="w-16" />
          </div>

          {/* 用户信息概览 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{user.nickname}</h2>
            <p className="text-white/70">
              星球编号：{user.planetNumber} · {USER_ROLES.find(r => r.value === user.role)?.label}
            </p>
          </div>

          {/* 标签切换 */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'info'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                个人信息
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'projects'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📁 我的作品 ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'favorites'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                我喜欢 ({totalFavorites})
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 编辑模式切换 */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">个人信息</h3>
                <div className="flex gap-3">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        保存
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑资料
                    </button>
                  )}
                </div>
              </div>

              {/* 表单字段 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 昵称 */}
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    昵称
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      value={editData.nickname || ''}
                      onChange={(e) => setEditData({...editData, nickname: e.target.value})}
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 backdrop-blur-sm">
                      {user.nickname}
                    </div>
                  )}
                </div>

                {/* 星球编号 */}
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    <Star className="w-4 h-4 inline mr-2" />
                    星球编号
                  </label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 backdrop-blur-sm">
                    {user.planetNumber}
                  </div>
                </div>

                {/* 学员身份 */}
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    学员身份
                  </label>
                  {editMode ? (
                    <select
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      value={editData.role || ''}
                      onChange={(e) => setEditData({...editData, role: e.target.value})}
                    >
                      {USER_ROLES.filter(role => {
                        // 如果当前用户不是管理员，则不能选择管理员角色
                        if (role.value === 'ADMIN' && user.role !== 'ADMIN') {
                          return false
                        }
                        return true
                      }).map(role => (
                        <option key={role.value} value={role.value} className="bg-gray-800">
                          {role.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 backdrop-blur-sm">
                      {USER_ROLES.find(r => r.value === user.role)?.label || user.role || '未设置'}
                    </div>
                  )}
                </div>

                {/* 技术水平 */}
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    技术水平
                  </label>
                  {editMode ? (
                    <select
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      value={editData.skillLevel || 'BEGINNER'}
                      onChange={(e) => setEditData({...editData, skillLevel: e.target.value})}
                    >
                      {SKILL_LEVELS.map(level => (
                        <option key={level.value} value={level.value} className="bg-gray-800" title={level.description}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 backdrop-blur-sm">
                      {SKILL_LEVELS.find(l => l.value === user.skillLevel)?.label || '未设置'}
                    </div>
                  )}
                </div>

                {/* 邮箱 */}
                <div className="md:col-span-2">
                  <label className="block text-white/90 font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    邮箱
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 backdrop-blur-sm">
                      {user.email || '未设置'}
                    </div>
                  )}
                </div>
              </div>

              {/* 账户操作 */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold text-white">账户操作</h4>
                    <p className="text-white/60">管理你的账户设置</p>
                  </div>
                  <button
                    onClick={logout}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* 作品列表头部 */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">我的作品</h3>
                <button
                  onClick={() => router.push('/upload')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  上传新作品
                </button>
              </div>

              {/* 作品列表 */}
              {projects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">📝</div>
                  <h4 className="text-xl font-bold mb-4 text-white">还没有作品</h4>
                  <p className="text-white/60 mb-8">快去上传你的第一个作品吧！</p>
                  <button
                    onClick={() => router.push('/upload')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-5 h-5" />
                    上传作品
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ y: -2 }}
                      className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm"
                    >
                      {/* 封面图 */}
                      <div className="aspect-video bg-white/5 rounded-lg mb-4 overflow-hidden">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/40">
                            封面图
                          </div>
                        )}
                      </div>

                      {/* 作品信息 */}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-white flex-1">
                          {project.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          project.isApproved
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {project.isApproved ? '已审核' : '待审核'}
                        </span>
                      </div>

                      <p className="text-white/70 text-sm mb-3 line-clamp-2">
                        {project.description || '暂无描述'}
                      </p>

                      <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                        <span>{project.bootcamp.name}</span>
                        <span className="flex items-center gap-1">
                          ❤️ {project.voteCount}
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {project.type === 'LINK' && project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              查看
                            </a>
                          )}
                          {project.type === 'HTML_FILE' && project.htmlFile && (
                            <a
                              href={project.htmlFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              预览
                            </a>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/edit/${project.id}`)}
                            className="text-sm px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-sm px-3 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              {/* 喜欢作品列表头部 */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">我喜欢的作品</h3>
                {totalFavorites > 0 && (
                  <div className="text-sm text-white/70">
                    共 {totalFavorites} 个作品，每页显示 {favoritesPerPage} 个
                  </div>
                )}
              </div>

              {/* 加载状态 */}
              {favoritesLoading ? (
                <div className="text-center py-16">
                  <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                  <p className="text-white/60">加载中...</p>
                </div>
              ) : favoriteProjects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">💝</div>
                  <h4 className="text-xl font-bold mb-4 text-white">暂无喜欢的作品</h4>
                  <p className="text-white/60 mb-8">去发现一些优秀的作品吧！</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
                  >
                    <Heart className="w-5 h-5" />
                    浏览作品
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favoriteProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ y: -2 }}
                      className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all backdrop-blur-sm"
                    >
                      {/* 封面图 */}
                      <div className="aspect-video bg-white/5 rounded-lg mb-4 overflow-hidden">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/40">
                            封面图
                          </div>
                        )}
                      </div>

                      {/* 作品信息 */}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-white flex-1">
                          {project.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          project.isApproved
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {project.isApproved ? '已审核' : '待审核'}
                        </span>
                      </div>

                      <p className="text-white/70 text-sm mb-3 line-clamp-2">
                        {project.description || '暂无描述'}
                      </p>

                      {/* 作者和投票信息 */}
                      <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                        <span>作者：{project.author?.nickname}</span>
                        <span className="flex items-center gap-1">
                          ❤️ {project.voteCount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                        <span>{project.bootcamp.name}</span>
                        <span className="text-xs">
                          {project.likedAt && new Date(project.likedAt).toLocaleDateString('zh-CN')} 喜欢
                        </span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {project.type === 'LINK' && project.projectUrl && (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              查看
                            </a>
                          )}
                          {project.type === 'HTML_FILE' && project.htmlFile && (
                            <a
                              href={project.htmlFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              预览
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/project/${project.id}`)}
                          className="text-sm px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          详情
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 分页控件 */}
              {totalFavoritePages > 1 && (
                <div className="flex justify-center items-center space-x-3 mt-8">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, currentFavoritePage - 1)
                      setCurrentFavoritePage(newPage)
                      if (user) fetchUserFavorites(user.id, newPage)
                    }}
                    disabled={currentFavoritePage === 1 || favoritesLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white/70 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <span>上一页</span>
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalFavoritePages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentFavoritePage(page)
                          if (user) fetchUserFavorites(user.id, page)
                        }}
                        disabled={favoritesLoading}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentFavoritePage === page
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'text-white/70 bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const newPage = Math.min(totalFavoritePages, currentFavoritePage + 1)
                      setCurrentFavoritePage(newPage)
                      if (user) fetchUserFavorites(user.id, newPage)
                    }}
                    disabled={currentFavoritePage === totalFavoritePages || favoritesLoading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white/70 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <span>下一页</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}