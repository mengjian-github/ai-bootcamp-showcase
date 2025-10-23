'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Link, FileText, Image, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import DeadlineNotice from '@/components/DeadlineNotice'

const USER_ROLES = [
  { value: 'COACH', label: '教练' },
  { value: 'ACTIONIST', label: '行动家' },
  { value: 'MEMBER', label: '圈友' },
  { value: 'VOLUNTEER', label: '志愿者' },
  { value: 'STAFF', label: '工作人员' },
]

interface Bootcamp {
  id: string
  name: string
}

export default function UploadPage() {
  const router = useRouter()
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bootcampId: '',
    type: 'LINK' as 'LINK' | 'HTML_FILE',
    projectUrl: '',
  })

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [isAfterDeadline, setIsAfterDeadline] = useState(false)

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      window.location.href = '/login'
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      window.location.href = '/login'
      return
    }

    fetchBootcamps()
    checkDeadline()
  }, [])

  const checkDeadline = async () => {
    try {
      const response = await fetch('/api/deadline')
      const data = await response.json()
      setIsAfterDeadline(data.isExpired)
    } catch (error) {
      console.error('Error checking deadline:', error)
      setIsAfterDeadline(false)
    }
  }

  const fetchBootcamps = async () => {
    try {
      const response = await fetch('/api/bootcamps')
      const data = await response.json()
      setBootcamps(data)
    } catch (error) {
      console.error('Error fetching bootcamps:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleHtmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
        toast.error('请选择HTML文件')
        return
      }
      setHtmlFile(file)
    }
  }

  const uploadFile = async (file: File, type: 'cover' | 'html'): Promise<string> => {
    console.log('uploadFile called with:', { fileName: file.name, fileSize: file.size, type })

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('type', type)

    console.log('Sending upload request to /api/upload...')
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData
    })

    console.log('Upload response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upload failed:', errorText)
      throw new Error(`文件上传失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Upload response data:', data)

    // API 返回的字段是 path 而不是 url
    const fileUrl = data.url || data.path
    if (!fileUrl) {
      console.error('Upload response missing URL/path:', data)
      throw new Error('上传响应中缺少 URL 或 path')
    }

    console.log('Using file URL:', fileUrl)
    return fileUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isAfterDeadline) {
      toast.error('提交已截止，无法上传作品')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        router.push('/login')
        return
      }

      if (!coverImageFile) {
        toast.error('请上传封面图片')
        return
      }

      let coverImageUrl = ''
      let htmlFileUrl = ''

      console.log('Starting file uploads...')
      console.log('Cover image file:', coverImageFile)

      // 上传封面图
      try {
        coverImageUrl = await uploadFile(coverImageFile, 'cover')
        console.log('Cover image uploaded successfully:', coverImageUrl)
      } catch (error) {
        console.error('Failed to upload cover image:', error)
        throw error
      }

      // 上传HTML文件
      if (htmlFile && formData.type === 'HTML_FILE') {
        try {
          htmlFileUrl = await uploadFile(htmlFile, 'html')
          console.log('HTML file uploaded successfully:', htmlFileUrl)
        } catch (error) {
          console.error('Failed to upload HTML file:', error)
          throw error
        }
      }

      // 创建作品
      const projectData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        projectUrl: formData.type === 'LINK' ? formData.projectUrl : null,
        htmlFile: formData.type === 'HTML_FILE' ? htmlFileUrl : null,
        coverImage: coverImageUrl,
        bootcampId: formData.bootcampId
      }

      console.log('Project data to be sent:', projectData)

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        toast.success('作品提交成功！')
        router.push('/')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || '提交失败')
      }
    } catch (error) {
      console.error('Error submitting project:', error)
      toast.error('提交作品失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Deadline Notice */}
      <DeadlineNotice />

      <div className="container mx-auto px-4 max-w-4xl py-8">
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
            <h1 className="text-3xl font-bold text-white">上传作品</h1>
            <div className="w-16" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 作品标题 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <FileText className="w-5 h-5 inline mr-2" />
                作品标题 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                placeholder="请输入作品标题"
              />
            </div>

            {/* 作品描述 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                作品描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm resize-none"
                placeholder="请描述一下你的作品..."
              />
            </div>

            {/* 训练营选择 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                所属训练营 *
              </label>
              <select
                name="bootcampId"
                value={formData.bootcampId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-gray-800">请选择训练营</option>
                {bootcamps.map(bootcamp => (
                  <option key={bootcamp.id} value={bootcamp.id} className="bg-gray-800">
                    {bootcamp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 作品类型 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                作品类型 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.type === 'LINK'
                    ? 'border-purple-400 bg-purple-400/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value="LINK"
                    checked={formData.type === 'LINK'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Link className="w-5 h-5 text-white mr-3" />
                  <span className="text-white">在线链接</span>
                </label>
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.type === 'HTML_FILE'
                    ? 'border-purple-400 bg-purple-400/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value="HTML_FILE"
                    checked={formData.type === 'HTML_FILE'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <Upload className="w-5 h-5 text-white mr-3" />
                  <span className="text-white">HTML文件</span>
                </label>
              </div>
            </div>

            {/* 条件显示：在线链接 */}
            {formData.type === 'LINK' && (
              <div>
                <label className="block text-white/90 font-medium mb-2">
                  <Link className="w-5 h-5 inline mr-2" />
                  作品链接 *
                </label>
                <input
                  type="url"
                  name="projectUrl"
                  value={formData.projectUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {/* 条件显示：HTML文件上传 */}
            {formData.type === 'HTML_FILE' && (
              <div>
                <label className="block text-white/90 font-medium mb-2">
                  <Upload className="w-5 h-5 inline mr-2" />
                  HTML文件 *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".html,text/html"
                    onChange={handleHtmlFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 border-dashed hover:border-white/40 transition-colors">
                    {htmlFile ? (
                      <span className="text-white">已选择: {htmlFile.name}</span>
                    ) : (
                      <span>点击选择HTML文件或拖拽到这里</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 封面图上传 */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                <Image className="w-5 h-5 inline mr-2" />
                封面图片 (建议800x600px) *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 border-dashed hover:border-white/40 transition-colors">
                  {coverImageFile ? (
                    <span className="text-white">已选择: {coverImageFile.name}</span>
                  ) : (
                    <span>点击选择封面图片或拖拽到这里</span>
                  )}
                </div>
              </div>

              {/* 封面图预览 */}
              {coverImagePreview && (
                <div className="mt-4">
                  <p className="text-white/70 text-sm mb-2">封面图预览:</p>
                  <img
                    src={coverImagePreview}
                    alt="封面图预览"
                    className="w-32 h-24 object-cover rounded-lg border border-white/20"
                  />
                </div>
              )}
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
                disabled={loading || isAfterDeadline}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    提交中...
                  </>
                ) : isAfterDeadline ? (
                  <>
                    <Save className="w-5 h-5" />
                    提交已截止
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    提交作品
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