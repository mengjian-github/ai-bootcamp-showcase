'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, Award, Star, ExternalLink, Heart, Edit, Trash2, Search, X } from 'lucide-react'
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
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState<string>('')
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

      const response = await fetch('/api/projects', {
        headers,
        credentials: 'include'
      })
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
    // 防止重复点击
    if (votingStates[projectId]) {
      return
    }

    // 设置投票状态
    setVotingStates(prev => ({ ...prev, [projectId]: true }))

    // 获取当前项目信息进行乐观更新
    const currentProject = projects.find(p => p.id === projectId)
    if (!currentProject) {
      setVotingStates(prev => ({ ...prev, [projectId]: false }))
      return
    }

    // 乐观更新 - 立即更新UI
    const optimisticUpdate = !currentProject.hasVoted
    const optimisticVoteCount = optimisticUpdate
      ? currentProject.voteCount + 1
      : currentProject.voteCount - 1

    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
              ...project,
              hasVoted: optimisticUpdate,
              voteCount: optimisticVoteCount
            }
          : project
      )
    )

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        // 使用服务器返回的准确投票数更新
        setProjects(prevProjects =>
          prevProjects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  hasVoted: data.voted,
                  voteCount: data.voteCount
                }
              : project
          )
        )

        if (data.voted) {
          toast.success('投票成功！感谢你的支持 ❤️')
        } else {
          toast.success('已取消投票')
        }
      } else {
        // 投票失败，回滚乐观更新
        setProjects(prevProjects =>
          prevProjects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  hasVoted: currentProject.hasVoted,
                  voteCount: currentProject.voteCount
                }
              : project
          )
        )

        if (response.status === 403) {
          toast.error(data.message || '投票失败')
        } else {
          toast.error('投票失败，请稍后重试')
        }
      }
    } catch (error) {
      console.error('Error voting:', error)

      // 网络错误，回滚乐观更新
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? {
                ...project,
                hasVoted: currentProject.hasVoted,
                voteCount: currentProject.voteCount
              }
            : project
        )
      )

      toast.error('网络错误，请稍后重试')
    } finally {
      // 清除投票状态
      setVotingStates(prev => ({ ...prev, [projectId]: false }))
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

  const filteredProjects = (() => {
    let filtered = Array.isArray(projects) ? projects : []

    // 按训练营过滤
    if (selectedBootcamp !== 'all') {
      filtered = filtered.filter(p => p.bootcamp.id === selectedBootcamp)
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        p.author.nickname.toLowerCase().includes(query) ||
        p.bootcamp.name.toLowerCase().includes(query)
      )
    }

    return filtered
  })()

  // 分页逻辑
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
  const startIndex = (currentPage - 1) * projectsPerPage
  const endIndex = startIndex + projectsPerPage
  const currentProjects = filteredProjects.slice(startIndex, endIndex)

  // 重置页码当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBootcamp, searchQuery])

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
                <span className="block">破局黑客松</span>
                <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  AI编程大赛
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
        {/* 整合的搜索和筛选工具栏 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              探索精彩作品
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              搜索、筛选和发现来自不同训练营的优秀AI编程作品
            </p>
          </div>

          {/* 搜索和筛选工具栏 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
            {/* 搜索框 */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="搜索作品标题、作者昵称或训练营..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 text-lg bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* 训练营筛选标签 */}
            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBootcamp('all')}
                className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedBootcamp === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>全部 ({projects.length})</span>
                </div>
              </motion.button>

              {bootcamps.map((bootcamp, index) => (
                <motion.button
                  key={bootcamp.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setSelectedBootcamp(bootcamp.id)}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedBootcamp === bootcamp.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>{bootcamp.name} ({bootcamp._count.projects})</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* 搜索结果提示 */}
            {(searchQuery || selectedBootcamp !== 'all') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    {searchQuery && selectedBootcamp !== 'all'
                      ? `在 "${bootcamps.find(b => b.id === selectedBootcamp)?.name || '选中训练营'}" 中找到 ${filteredProjects.length} 个相关作品`
                      : searchQuery
                        ? `找到 ${filteredProjects.length} 个相关作品`
                        : `${bootcamps.find(b => b.id === selectedBootcamp)?.name || '选中训练营'} 共有 ${filteredProjects.length} 个作品`
                    }
                  </span>
                </div>
              </motion.div>
            )}
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
                      onClick={() => window.open(`/project/${project.id}`, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Star className="w-4 h-4" />
                      <span>查看详情</span>
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
                    disabled={votingStates[project.id]}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-red-50 group-vote ${
                      votingStates[project.id] ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <motion.div
                      animate={project.hasVoted ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {votingStates[project.id] ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full"
                        />
                      ) : project.hasVoted ? (
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
              {(() => {
                const pages = []
                const showPages = 5 // 显示的页码数量
                const halfShow = Math.floor(showPages / 2)

                let startPage = Math.max(1, currentPage - halfShow)
                let endPage = Math.min(totalPages, currentPage + halfShow)

                // 调整边界情况
                if (endPage - startPage + 1 < showPages) {
                  if (startPage === 1) {
                    endPage = Math.min(totalPages, startPage + showPages - 1)
                  } else {
                    startPage = Math.max(1, endPage - showPages + 1)
                  }
                }

                // 第一页
                if (startPage > 1) {
                  pages.push(
                    <motion.button
                      key={1}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(1)}
                      className="w-12 h-12 text-sm font-semibold rounded-xl transition-all duration-300 text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                    >
                      1
                    </motion.button>
                  )

                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="flex items-center px-2 text-gray-400">
                        ...
                      </span>
                    )
                  }
                }

                // 中间页码
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(i)}
                      className={`w-12 h-12 text-sm font-semibold rounded-xl transition-all duration-300 ${
                        currentPage === i
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {i}
                    </motion.button>
                  )
                }

                // 最后一页
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="flex items-center px-2 text-gray-400">
                        ...
                      </span>
                    )
                  }

                  pages.push(
                    <motion.button
                      key={totalPages}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-12 h-12 text-sm font-semibold rounded-xl transition-all duration-300 text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600"
                    >
                      {totalPages}
                    </motion.button>
                  )
                }

                return pages
              })()}
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
