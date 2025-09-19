'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, Upload, Link, FileText, Image } from 'lucide-react'
import toast from 'react-hot-toast'

interface Bootcamp {
  id: string
  name: string
}

interface Project {
  id: string
  title: string
  description: string
  type: 'HTML_FILE' | 'LINK'
  htmlFile?: string
  projectUrl?: string
  coverImage: string
  bootcampId: string
  bootcamp: {
    id: string
    name: string
  }
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK' as 'HTML_FILE' | 'LINK',
    projectUrl: '',
    bootcampId: ''
  })
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // 获取作品详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(`/api/projects?admin=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const projects = await response.json()
          const currentProject = projects.find((p: Project) => p.id === projectId)

          if (currentProject) {
            setProject(currentProject)
            setFormData({
              title: currentProject.title,
              description: currentProject.description || '',
              type: currentProject.type,
              projectUrl: currentProject.projectUrl || '',
              bootcampId: currentProject.bootcampId
            })
            setCoverImagePreview(currentProject.coverImage)
          } else {
            toast.error('作品不存在')
            router.push('/')
          }
        } else if (response.status === 401) {
          toast.error('请先登录')
          router.push('/login')
        } else {
          toast.error('获取作品信息失败')
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        toast.error('获取作品信息失败')
      } finally {
        setPageLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router])

  // 获取训练营列表
  useEffect(() => {
    const fetchBootcamps = async () => {
      try {
        const response = await fetch('/api/bootcamps')
        if (response.ok) {
          const data = await response.json()
          setBootcamps(data)
        }
      } catch (error) {
        console.error('Error fetching bootcamps:', error)
      }
    }

    fetchBootcamps()
  }, [])

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
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        router.push('/login')
        return
      }

      let coverImageUrl = project?.coverImage || ''
      let htmlFileUrl = project?.htmlFile || ''

      console.log('Original cover image:', project?.coverImage)
      console.log('Has new cover image file:', !!coverImageFile)

      // 上传新的封面图
      if (coverImageFile) {
        console.log('Uploading new cover image...')
        try {
          const newCoverUrl = await uploadFile(coverImageFile, 'cover')
          console.log('New cover image uploaded:', newCoverUrl)
          coverImageUrl = newCoverUrl
        } catch (error) {
          console.error('Failed to upload cover image:', error)
          throw error
        }
      }

      // 上传新的HTML文件
      if (htmlFile && formData.type === 'HTML_FILE') {
        console.log('Uploading new HTML file...')
        try {
          const newHtmlUrl = await uploadFile(htmlFile, 'html')
          console.log('New HTML file uploaded:', newHtmlUrl)
          htmlFileUrl = newHtmlUrl
        } catch (error) {
          console.error('Failed to upload HTML file:', error)
          throw error
        }
      }

      console.log('Final cover image URL:', coverImageUrl)
      console.log('Final HTML file URL:', htmlFileUrl)

      // 更新作品
      const updateData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        projectUrl: formData.type === 'LINK' ? formData.projectUrl : null,
        htmlFile: formData.type === 'HTML_FILE' ? htmlFileUrl : null,
        coverImage: coverImageUrl,
        bootcampId: formData.bootcampId
      }

      console.log('Update data being sent:', updateData)

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('作品更新成功！')
        router.push('/')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || '更新失败')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('更新作品失败')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">作品不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
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
            <h1 className="text-3xl font-bold text-white">编辑作品</h1>
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
                  HTML文件 {htmlFile || project.htmlFile ? '' : '*'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".html,text/html"
                    onChange={handleHtmlFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 border-dashed hover:border-white/40 transition-colors">
                    {htmlFile ? (
                      <span className="text-white">已选择: {htmlFile.name}</span>
                    ) : project.htmlFile ? (
                      <span className="text-white">当前文件: {project.htmlFile.split('/').pop()}</span>
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
                封面图片 (建议800x600px)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 border-dashed hover:border-white/40 transition-colors">
                  {coverImageFile ? (
                    <span className="text-white">已选择: {coverImageFile.name}</span>
                  ) : (
                    <span>点击选择封面图片或拖拽到这里 (可选)</span>
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
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    更新中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    更新作品
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