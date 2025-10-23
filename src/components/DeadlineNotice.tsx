'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DeadlineInfo {
  hasDeadline: boolean
  deadline: string | null
  isExpired: boolean
  timeRemaining?: number
}

export default function DeadlineNotice() {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取截止时间信息
  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const response = await fetch('/api/deadline')
        const data: DeadlineInfo = await response.json()
        
        setDeadlineInfo(data)
        
        if (data.hasDeadline && data.deadline) {
          setIsExpired(data.isExpired)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('获取截止时间失败:', error)
        setLoading(false)
      }
    }

    fetchDeadline()
    // 每30秒重新获取一次，确保时间准确
    const refreshInterval = setInterval(fetchDeadline, 30000)
    
    return () => clearInterval(refreshInterval)
  }, [])

  // 更新倒计时
  useEffect(() => {
    if (!deadlineInfo?.hasDeadline || !deadlineInfo.deadline) return

    const deadline = new Date(deadlineInfo.deadline)

    const updateTimeLeft = () => {
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft('已截止')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}天 ${hours}小时 ${minutes}分钟`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}小时 ${minutes}分钟 ${seconds}秒`)
      } else {
        setTimeLeft(`${minutes}分钟 ${seconds}秒`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [deadlineInfo])

  if (loading || !isVisible || !deadlineInfo?.hasDeadline || !deadlineInfo.deadline) return null

  const deadline = new Date(deadlineInfo.deadline)
  const formattedDeadline = deadline.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 ${
          isExpired
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-600'
            : 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500'
        } shadow-lg backdrop-blur-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <motion.div
                animate={isExpired ? {} : { rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                {isExpired ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <Clock className="w-6 h-6 text-white" />
                )}
              </motion.div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-sm sm:text-base">
                      {isExpired ? '提交和投票已截止' : '提交和投票截止时间'}
                    </span>
                    {!isExpired && (
                      <span className="text-white/90 text-sm sm:text-base">
                        {formattedDeadline}
                      </span>
                    )}
                  </div>

                  {!isExpired && timeLeft && (
                    <motion.div
                      key={timeLeft}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-mono font-bold text-sm sm:text-base mt-1 sm:mt-0"
                    >
                      剩余：{timeLeft}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="ml-4 text-white/80 hover:text-white transition-colors p-1"
              aria-label="关闭提醒"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
