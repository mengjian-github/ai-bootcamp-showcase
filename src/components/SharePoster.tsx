'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'

interface SharePosterProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    title: string
    description: string | null
    coverImage: string
    voteCount: number
    author: {
      nickname: string
      planetNumber: string
      skillLevel: string
    }
    bootcamp: {
      name: string
    }
  }
}

export default function SharePoster({ isOpen, onClose, project }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [posterUrl, setPosterUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      generatePoster()
    }
  }, [isOpen])

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 3
  ) => {
    const words = text.split('')
    let line = ''
    let lineCount = 0

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, y + lineCount * lineHeight)
        line = words[i]
        lineCount++

        if (lineCount >= maxLines) {
          // 添加省略号
          const ellipsis = line.slice(0, -3) + '...'
          ctx.fillText(ellipsis, x, y + (lineCount - 1) * lineHeight)
          break
        }
      } else {
        line = testLine
      }
    }

    if (lineCount < maxLines && line !== '') {
      ctx.fillText(line, x, y + lineCount * lineHeight)
    }
  }

  const generatePoster = async () => {
    if (!canvasRef.current) return

    setLoading(true)
    setError('')

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法获取Canvas上下文')

      // 设置画布尺寸（竖屏）
      const width = 750
      const height = 1334
      canvas.width = width
      canvas.height = height

      // 背景渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#020617')
      gradient.addColorStop(0.5, '#0f172a')
      gradient.addColorStop(1, '#1e293b')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // 添加赛博朋克光效背景
      const radialGradient = ctx.createRadialGradient(width / 2, 200, 0, width / 2, 200, 400)
      radialGradient.addColorStop(0, 'rgba(34, 211, 238, 0.15)')
      radialGradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
      ctx.fillStyle = radialGradient
      ctx.fillRect(0, 0, width, height)

      // 绘制顶部Logo和标题区域（Logo左对齐，标题居中）
      const headerY = 35
      try {
        const logoImg = await loadImage('/logo.png')
        // Logo是800x220的长条，按比例缩放
        const logoWidth = 200
        const logoHeight = logoWidth * (220 / 800) // 保持比例
        const logoX = 40

        // 绘制Logo（左对齐）
        ctx.drawImage(logoImg, logoX, headerY, logoWidth, logoHeight)
      } catch (error) {
        console.error('Logo加载失败，继续生成海报:', error)
      }

      // 标题居中显示（单行）
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('破局黑客松 ', width / 2, headerY + 45)

      // AI编程大赛用青色，紧跟在后面
      const title1Width = ctx.measureText('破局黑客松 ').width
      ctx.fillStyle = '#22d3ee'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('AI编程大赛', width / 2 + title1Width / 2, headerY + 45)

      // 加载并绘制封面图片
      try {
        const coverImg = await loadImage(project.coverImage)
        const coverHeight = 340
        const coverWidth = width - 80
        const coverX = 40
        const coverY = 140

        // 绘制图片背景卡片
        ctx.shadowColor = 'rgba(34, 211, 238, 0.3)'
        ctx.shadowBlur = 20
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
        ctx.fillRect(coverX - 10, coverY - 10, coverWidth + 20, coverHeight + 20)
        ctx.shadowBlur = 0

        // 计算图片缩放以适应区域（保持比例）
        const scale = Math.min(coverWidth / coverImg.width, coverHeight / coverImg.height)
        const scaledWidth = coverImg.width * scale
        const scaledHeight = coverImg.height * scale
        const imgX = coverX + (coverWidth - scaledWidth) / 2
        const imgY = coverY + (coverHeight - scaledHeight) / 2

        ctx.drawImage(coverImg, imgX, imgY, scaledWidth, scaledHeight)
      } catch (error) {
        console.error('封面图片加载失败:', error)
        // 绘制默认封面
        ctx.fillStyle = 'rgba(34, 211, 238, 0.1)'
        ctx.fillRect(40, 140, width - 80, 340)
        ctx.fillStyle = '#22d3ee'
        ctx.font = 'bold 32px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('精彩作品', width / 2, 310)
      }

      // 绘制作品标题（大幅下移，增加呼吸空间）
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 42px sans-serif'
      ctx.textAlign = 'left'
      ctx.shadowColor = 'rgba(34, 211, 238, 0.5)'
      ctx.shadowBlur = 15
      wrapText(ctx, project.title, 50, 560, width - 100, 50, 2)
      ctx.shadowBlur = 0

      // 绘制描述
      if (project.description) {
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '24px sans-serif'
        wrapText(ctx, project.description, 50, 665, width - 100, 38, 3)
      }

      // 绘制作者信息卡片（整合所有用户信息）
      const authorCardY = 790
      const cardHeight = 200
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(40, authorCardY, width - 80, cardHeight, 12)
      ctx.fill()
      ctx.stroke()

      // 作者头像（圆形，增加左外边距）
      const avatarCenterX = 95 // 从85增加到95
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarCenterX, authorCardY + 70, 40, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      // 头像背景渐变
      const avatarGradient = ctx.createLinearGradient(55, authorCardY + 30, 135, authorCardY + 110)
      avatarGradient.addColorStop(0, '#22d3ee')
      avatarGradient.addColorStop(1, '#6366f1')
      ctx.fillStyle = avatarGradient
      ctx.fillRect(55, authorCardY + 30, 80, 80)

      // 头像文字
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(project.author.nickname.charAt(0), avatarCenterX, authorCardY + 78)
      ctx.restore()

      // 作者昵称
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(project.author.nickname, 155, authorCardY + 50)

      // 星球编号
      ctx.fillStyle = '#94a3b8'
      ctx.font = '20px sans-serif'
      ctx.fillText(`星球编号: ${project.author.planetNumber}`, 155, authorCardY + 82)

      // 技能水平标签
      const skillLevelText =
        project.author.skillLevel === 'BEGINNER' ? '🌱 零基础' :
        project.author.skillLevel === 'INTERMEDIATE' ? '💪 有基础' : '🚀 专业级'

      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(155, authorCardY + 96, 125, 34, 17)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#22d3ee'
      ctx.font = '18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(skillLevelText, 217, authorCardY + 118)

      // 训练营信息（在卡片内，居中显示）
      ctx.fillStyle = '#94a3b8'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('训练营:', 60, authorCardY + 160)

      ctx.fillStyle = '#22d3ee'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(project.bootcamp.name, 155, authorCardY + 160)

      // 生成二维码
      const url = typeof window !== 'undefined' ? window.location.href : ''
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 160,
        margin: 1,
        color: {
          dark: '#22d3ee',
          light: '#020617'
        }
      })

      const qrImg = await loadImage(qrCodeDataUrl)
      const qrSize = 160
      const qrY = 1050
      const qrX = (width - qrSize) / 2

      // 二维码背景
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
      ctx.shadowColor = 'rgba(34, 211, 238, 0.3)'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 12)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // 二维码提示文字
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('扫码查看作品详情', width / 2, qrY + qrSize + 40)

      // 底部品牌水印
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
      ctx.font = '18px sans-serif'
      ctx.fillText('AI编程训练营作品展示', width / 2, height - 35)

      // 导出图片
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setPosterUrl(dataUrl)
    } catch (err) {
      console.error('生成海报失败:', err)
      setError('生成海报失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!posterUrl) return

    const link = document.createElement('a')
    link.download = `${project.title}-分享海报.png`
    link.href = posterUrl
    link.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100">分享海报</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <p className="text-slate-400">正在生成海报...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <p className="text-rose-400 mb-4">{error}</p>
                  <button
                    onClick={generatePoster}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    重新生成
                  </button>
                </div>
              )}

              {!loading && !error && posterUrl && (
                <div className="space-y-4">
                  <img
                    src={posterUrl}
                    alt="分享海报"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-slate-400 text-center">
                    长按图片保存到相册
                  </p>
                </div>
              )}

              {/* Canvas（隐藏） */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 底部按钮 */}
            {!loading && !error && posterUrl && (
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>下载海报</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
