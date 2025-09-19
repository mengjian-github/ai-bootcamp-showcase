'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, Award, Star, ExternalLink, Heart, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Bootcamp {
  id: string
  name: string
  description: string | null
  _count: {
    projects: number
  }
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
  hasVoted: boolean
  author: {
    id: string
    nickname: string
    planetNumber: string
    role: string
    skillLevel: string
    avatar: string | null
  }
  bootcamp: {
    id: string
    name: string
  }
  _count: {
    votes: number
  }
}

export default function Home() {
  const router = useRouter()
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedBootcamp, setSelectedBootcamp] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const projectsPerPage = 6

  useEffect(() => {
    fetchBootcamps()
    fetchProjects()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const user = await response.json()
        console.log('Current user fetched:', user)
        setCurrentUser(user)
      } else {
        console.log('Failed to fetch current user:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchBootcamps = async () => {
    try {
      const response = await fetch('/api/bootcamps')
      const data = await response.json()
      setBootcamps(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching bootcamps:', error)
      setBootcamps([])
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch('/api/projects', { headers })
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (projectId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        fetchProjects()
        toast.success('投票成功！感谢你的支持 ❤️')
      } else if (response.status === 401) {
        toast.error('请先登录后再投票')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } else if (response.status === 403) {
        toast.error(data.message || '投票失败')
      } else {
        toast.error('投票失败，请稍后重试')
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`确定要删除作品"${projectTitle}"吗？此操作不可撤销。`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('请先登录')
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('作品删除成功')
        fetchProjects()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('删除作品失败')
    }
  }

  const viewProject = (project: Project) => {
    if (project.type === 'LINK' && project.projectUrl) {
      window.open(project.projectUrl, '_blank')
    } else if (project.type === 'HTML_FILE' && project.htmlFile) {
      window.open(project.htmlFile, '_blank')
    }
  }

  const canEditProject = (project: Project) => {
    console.log('canEditProject check:', {
      currentUser,
      projectAuthorId: project.author.id,
      userCanEdit: currentUser && (currentUser.id === project.author.id || currentUser.role === 'ADMIN')
    })
    return currentUser && (currentUser.id === project.author.id || currentUser.role === 'ADMIN')
  }

  const filteredProjects = selectedBootcamp === 'all'
    ? (Array.isArray(projects) ? projects : [])
    : (Array.isArray(projects) ? projects.filter(p => p.bootcamp.id === selectedBootcamp) : [])

  // 分页逻辑
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
  const startIndex = (currentPage - 1) * projectsPerPage
  const endIndex = startIndex + projectsPerPage
  const currentProjects = filteredProjects.slice(startIndex, endIndex)

  // 重置页码当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBootcamp])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hero-section py-24 mb-16 relative overflow-hidden"
      >
        {/* Floating Elements Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 border border-white/30">
                <Star className="w-4 h-4 mr-2 text-yellow-300" />
                探索AI编程的无限可能
              </div>
              <h1 className="text-6xl md:text-7xl font-black mb-6 text-white leading-tight">
                <span className="block">AI编程</span>
                <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  训练营
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
                在这里，创意与技术完美融合，每一个作品都是对未来的探索
              </p>
            </motion.div>

            {/* Enhanced Stats Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mb-4 mx-auto group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {bootcamps.length}
                </div>
                <div className="text-white/80 font-medium">个训练营</div>
                <div className="text-sm text-white/60 mt-2">持续增长中</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl mb-4 mx-auto group-hover:from-purple-500 group-hover:to-purple-700 transition-all duration-300">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {projects.length}
                </div>
                <div className="text-white/80 font-medium">个优秀作品</div>
                <div className="text-sm text-white/60 mt-2">创意无限</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl mb-4 mx-auto group-hover:from-pink-500 group-hover:to-pink-700 transition-all duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {projects.reduce((sum, p) => sum + p.voteCount, 0)}
                </div>
                <div className="text-white/80 font-medium">个点赞</div>
                <div className="text-sm text-white/60 mt-2">社区认可</div>
              </motion.div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12"
            >
              <motion.a
                href="/upload"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Star className="w-5 h-5 mr-2" />
                分享我的作品
                <ExternalLink className="w-4 h-4 ml-2" />
              </motion.a>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Enhanced 训练营选择器 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              选择训练营
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              每个训练营都有独特的创意方向，探索不同领域的AI编程作品
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedBootcamp('all')}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedBootcamp === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/60 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white/80 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>全部作品 ({projects.length})</span>
              </div>
              {selectedBootcamp === 'all' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                  style={{ zIndex: -1 }}
                />
              )}
            </motion.button>

            {bootcamps.map((bootcamp, index) => (
              <motion.button
                key={bootcamp.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedBootcamp(bootcamp.id)}
                className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedBootcamp === bootcamp.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/60 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white/80 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>{bootcamp.name} ({bootcamp._count.projects})</span>
                </div>
                {selectedBootcamp === bootcamp.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Enhanced 作品展示区 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {selectedBootcamp === 'all' ? '全部精彩作品' : bootcamps.find(b => b.id === selectedBootcamp)?.name}
            </h3>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                <Award className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-blue-700">{filteredProjects.length}</span>
                <span className="text-blue-600">个作品</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 rounded-full">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-purple-600">按投票数排序</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {currentProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { y: 50, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 hover:border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
            >
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* 封面图 */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                {project.coverImage ? (
                  <>
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mb-2 mx-auto">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-gray-500 text-sm">精彩作品</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 作品信息 */}
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                  {project.title}
                </h4>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {project.description || '这是一个充满创意的AI编程作品，等待你的探索...'}
                </p>

                {/* 训练营标识 */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 border border-blue-200/50">
                    <Award className="w-3 h-3 mr-1" />
                    {project.bootcamp.name}
                  </span>
                </div>

                {/* 作者信息 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {project.author.nickname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.author.nickname}</div>
                      <div className="text-xs text-gray-500">星球编号: {project.author.planetNumber}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      project.author.skillLevel === 'BEGINNER' ? 'bg-green-50 text-green-700 border border-green-200' :
                      project.author.skillLevel === 'INTERMEDIATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {project.author.skillLevel === 'BEGINNER' && '🌱 零基础'}
                      {project.author.skillLevel === 'INTERMEDIATE' && '💪 有基础'}
                      {project.author.skillLevel === 'ADVANCED' && '🚀 专业级'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium tag-role ${project.author.role}`}>
                      {project.author.role === 'COACH' && '🎯 教练'}
                      {project.author.role === 'ACTIONIST' && '⚡ 行动家'}
                      {project.author.role === 'MEMBER' && '👥 圈友'}
                      {project.author.role === 'VOLUNTEER' && '🤝 志愿者'}
                      {project.author.role === 'STAFF' && '🛠️ 工作人员'}
                      {project.author.role === 'ADMIN' && '👑 管理员'}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => viewProject(project)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>查看作品</span>
                    </motion.button>

                    {/* 编辑和删除按钮 - 只有作者和管理员可见 */}
                    {canEditProject(project) && (
                      <div className="flex items-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/edit/${project.id}`)}
                          className="flex items-center justify-center w-8 h-8 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-all duration-300"
                          title="编辑作品"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteProject(project.id, project.title)}
                          className="flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-300"
                          title="删除作品"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(project.id)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-red-50 group-vote"
                  >
                    <motion.div
                      animate={project.hasVoted ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {project.hasVoted ? (
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      ) : (
                        <Heart className="w-5 h-5 text-gray-400 group-vote-hover:text-red-400" />
                      )}
                    </motion.div>
                    <span className={`font-semibold text-sm ${
                      project.hasVoted ? 'text-red-500' : 'text-gray-600 group-vote-hover:text-red-500'
                    }`}>
                      {project.voteCount}
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced 分页 */}
        {totalPages > 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center items-center space-x-3 mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span>上一页</span>
            </motion.button>

            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-12 h-12 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span>下一页</span>
            </motion.button>
          </motion.div>
        )}

        {/* Enhanced 空状态 */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20 px-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg mx-auto max-w-md"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="text-6xl mb-6"
            >
              🎨
            </motion.div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
              暂无作品展示
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              这个训练营还在等待第一个精彩作品的诞生，<br />
              也许下一个就是你的创意之作！
            </p>
            <motion.a
              href="/upload"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Star className="w-4 h-4" />
              <span>成为第一个</span>
            </motion.a>
          </motion.div>
        )}
      </div>
    </div>
  )
}