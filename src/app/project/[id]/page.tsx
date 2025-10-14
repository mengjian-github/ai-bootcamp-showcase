'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Heart, Share2, Award, Star, Copy, Check, Github, Calendar, User, Globe } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import SharePoster from '@/components/SharePoster'

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
  const [showPoster, setShowPoster] = useState(false)

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

  const shareProject = () => {
    setShowPoster(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(2,6,23,0.95))] flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(2,6,23,0.95))] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-100 drop-shadow-[0_0_16px_rgba(34,211,238,0.35)]">作品不存在</h1>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 transition-all duration-300 shadow-[0_16px_32px_rgba(2,6,23,0.65)] hover:shadow-[0_20px_40px_rgba(34,211,238,0.35)]"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_rgba(2,6,23,0.95))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-slate-400 hover:text-cyan-300 mb-8 transition-colors duration-200"
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
            <div className="card p-0 overflow-hidden mb-8">
              <div className="aspect-video bg-slate-900/70 border-b border-slate-800 relative overflow-hidden">
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-[0_0_24px_rgba(34,211,238,0.35)]">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-slate-300 text-lg">精彩作品</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 作品标题和描述 */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-100 mb-4 drop-shadow-[0_0_18px_rgba(34,211,238,0.35)]">{project.title}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-100 border border-cyan-500/30">
                      <Award className="w-4 h-4 mr-1 text-cyan-300" />
                      {project.bootcamp.name}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 作品描述 */}
              {project.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">作品介绍</h3>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
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
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 transition-all duration-300 shadow-[0_18px_40px_rgba(2,6,23,0.65)] hover:shadow-[0_22px_46px_rgba(34,211,238,0.4)]"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>查看作品</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareProject}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900/70 border border-cyan-500/30 text-slate-100 font-semibold hover:bg-slate-900/80 transition-all duration-300 shadow-[0_10px_28px_rgba(2,6,23,0.6)]"
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
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">作者信息</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.3)]">
                  <span className="text-white font-bold text-lg">
                    {project.author.nickname.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-100">{project.author.nickname}</div>
                  <div className="text-sm text-slate-400">星球编号: {project.author.planetNumber}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">技能水平</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    project.author.skillLevel === 'BEGINNER' ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30' :
                    project.author.skillLevel === 'INTERMEDIATE' ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30' :
                    'bg-purple-500/15 text-purple-200 border border-purple-400/30'
                  }`}>
                    {project.author.skillLevel === 'BEGINNER' && '🌱 零基础'}
                    {project.author.skillLevel === 'INTERMEDIATE' && '💪 有基础'}
                    {project.author.skillLevel === 'ADVANCED' && '🚀 专业级'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">角色</span>
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
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">为作品投票</h3>
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVote}
                  disabled={votingState}
                  className={`group w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                    project.hasVoted
                      ? 'bg-rose-500/15 border-2 border-rose-400/40 text-rose-300 hover:bg-rose-500/25'
                      : 'bg-slate-900/60 border-2 border-slate-700 text-slate-200 hover:bg-rose-500/10 hover:border-rose-400/40 hover:text-rose-300'
                  } ${votingState ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {votingState ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-rose-500/40 border-t-rose-400 rounded-full"
                    />
                  ) : (
                    <Heart className={`w-6 h-6 ${project.hasVoted ? 'fill-current text-rose-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.45)]' : 'text-slate-300 group-hover:text-rose-400'}`} />
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{project.voteCount}</div>
                    <div className="text-sm text-slate-300">{project.hasVoted ? '已投票' : '点赞支持'}</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* 作品信息 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">作品信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">作品类型</span>
                  <span className="text-sm font-medium text-slate-100 flex items-center">
                    {project.type === 'LINK' ? (
                      <>
                        <Globe className="w-4 h-4 mr-1 text-cyan-300" />
                        在线链接
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-1 text-cyan-300" />
                        HTML文件
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">发布时间</span>
                  <span className="text-sm font-medium text-slate-100">
                    {new Date(project.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">所属训练营</span>
                  <span className="text-sm font-medium text-cyan-300">
                    {project.bootcamp.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 分享海报 */}
      {project && (
        <SharePoster
          isOpen={showPoster}
          onClose={() => setShowPoster(false)}
          project={project}
        />
      )}
    </div>
  )
}
