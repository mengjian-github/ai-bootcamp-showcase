'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Star, Target, BarChart3, Mail, Lock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    planetNumber: '',
    role: '',
    skillLevel: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 去除密码前后空格后再比较
    const trimmedPassword = formData.password.trim()
    const trimmedConfirmPassword = formData.confirmPassword.trim()

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error('密码确认不匹配，请重新输入')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          planetNumber: formData.planetNumber.trim(),
          role: formData.role,
          skillLevel: formData.skillLevel,
          email: formData.email || null,
          password: trimmedPassword
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // 触发自定义事件通知其他组件登录状态改变
        window.dispatchEvent(new CustomEvent('loginSuccess'))

        toast.success('🎉 注册成功！欢迎加入AI编程训练营！')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.message || '注册失败，请重试')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
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
            <h1 className="text-3xl font-bold text-white">加入我们</h1>
            <div className="w-16" />
          </div>

          {/* 登录链接 */}
          <div className="text-center mb-8">
            <p className="text-white/70">
              已有账号？{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-white hover:text-purple-300 font-medium transition-colors"
              >
                点击登录
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 昵称 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <User className="w-5 h-5 inline mr-2" />
                昵称 *
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="输入你的昵称"
              />
            </div>

            {/* 星球编号 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Star className="w-5 h-5 inline mr-2" />
                星球编号 *
              </label>
              <input
                type="text"
                name="planetNumber"
                value={formData.planetNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="请输入纯数字，例如：001"
              />
            </div>

            {/* 学员身份 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Target className="w-5 h-5 inline mr-2" />
                学员身份 *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-gray-800">请选择身份</option>
                {USER_ROLES.map(role => (
                  <option key={role.value} value={role.value} className="bg-gray-800">
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 技术水平 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <BarChart3 className="w-5 h-5 inline mr-2" />
                技术水平 *
              </label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-gray-800">请选择技术水平</option>
                {SKILL_LEVELS.map(level => (
                  <option key={level.value} value={level.value} className="bg-gray-800" title={level.description}>
                    {level.label}
                  </option>
                ))}
              </select>
              {formData.skillLevel && (
                <p className="text-white/60 text-sm mt-2">
                  {SKILL_LEVELS.find(l => l.value === formData.skillLevel)?.description}
                </p>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Mail className="w-5 h-5 inline mr-2" />
                邮箱（可选）
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="输入你的邮箱地址"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Lock className="w-5 h-5 inline mr-2" />
                密码 *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="设置密码（至少6位）"
              />
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Lock className="w-5 h-5 inline mr-2" />
                确认密码 *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="再次输入密码"
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    注册
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}