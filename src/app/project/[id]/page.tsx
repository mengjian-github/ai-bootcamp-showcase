'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Heart, Share2, Award, Star, Copy, Check, Github, Calendar, User, Globe } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

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
  createdAt: string
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
}

export default function ProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [votingState, setVotingState] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
      fetchCurrentUser()
    }
  }, [params.id])

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
        setCurrentUser(user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchProject = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/projects/${id}`, {
        headers,
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        toast.error('作品不存在')
        router.push('/')
      } else {
        toast.error('获取作品信息失败')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!project) return

    const token = localStorage.getItem('token')

    if (votingState) return

    setVotingState(true)

    // 乐观更新
    const optimisticUpdate = !project.hasVoted
    const optimisticVoteCount = optimisticUpdate
      ? project.voteCount + 1
      : project.voteCount - 1

    setProject(prev => prev ? {
      ...prev,
      hasVoted: optimisticUpdate,
      voteCount: optimisticVoteCount
    } : null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/projects/${project.id}/vote`, {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setProject(prev => prev ? {
          ...prev,
          hasVoted: data.voted,
          voteCount: data.voteCount
        } : null)

        if (data.voted) {
          toast.success('投票成功！感谢你的支持 ❤️')
        } else {
          toast.success('已取消投票')
        }
      } else {
        // 回滚
        setProject(prev => prev ? {
          ...prev,
          hasVoted: !optimisticUpdate,
          voteCount: project.voteCount
        } : null)

        if (response.status === 403) {
          toast.error(data.message || '投票失败')
        } else {
          toast.error('投票失败，请稍后重试')
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
      // 回滚
      setProject(prev => prev ? {
        ...prev,
        hasVoted: !optimisticUpdate,
        voteCount: project.voteCount
      } : null)
      toast.error('网络错误，请稍后重试')
    } finally {
      setVotingState(false)
    }
  }

  const viewProject = () => {
    if (!project) return

    if (project.type === 'LINK' && project.projectUrl) {
      window.open(project.projectUrl, '_blank')
    } else if (project.type === 'HTML_FILE' && project.htmlFile) {
      window.open(project.htmlFile, '_blank')
    }
  }

  const shareProject = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.description || '来看看这个精彩的AI编程作品！',
          url: url
        })
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('链接已复制到剪贴板')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast.error('复制链接失败')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">作品不存在</h1>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            {/* 作品封面 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg overflow-hidden mb-8">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-gray-500 text-lg">精彩作品</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 作品标题和描述 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 border border-blue-200/50">
                      <Award className="w-4 h-4 mr-1" />
                      {project.bootcamp.name}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 作品描述 */}
              {project.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">作品介绍</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={viewProject}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>查看作品</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareProject}
                  className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  <span>{copied ? '已复制' : '分享'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* 侧边栏 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* 作者信息 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">作者信息</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {project.author.nickname.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{project.author.nickname}</div>
                  <div className="text-sm text-gray-500">星球编号: {project.author.planetNumber}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">技能水平</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    project.author.skillLevel === 'BEGINNER' ? 'bg-green-50 text-green-700 border border-green-200' :
                    project.author.skillLevel === 'INTERMEDIATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {project.author.skillLevel === 'BEGINNER' && '🌱 零基础'}
                    {project.author.skillLevel === 'INTERMEDIATE' && '💪 有基础'}
                    {project.author.skillLevel === 'ADVANCED' && '🚀 专业级'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">角色</span>
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
            </div>

            {/* 投票区域 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">为作品投票</h3>
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVote}
                  disabled={votingState}
                  className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                    project.hasVoted
                      ? 'bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                  } ${votingState ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {votingState ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-red-300 border-t-red-500 rounded-full"
                    />
                  ) : (
                    <Heart className={`w-6 h-6 ${project.hasVoted ? 'fill-current' : ''}`} />
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{project.voteCount}</div>
                    <div className="text-sm">{project.hasVoted ? '已投票' : '点赞支持'}</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* 作品信息 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">作品信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">作品类型</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center">
                    {project.type === 'LINK' ? (
                      <>
                        <Globe className="w-4 h-4 mr-1" />
                        在线链接
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-1" />
                        HTML文件
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">发布时间</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">所属训练营</span>
                  <span className="text-sm font-medium text-blue-600">
                    {project.bootcamp.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
