import { NextResponse } from 'next/server'

/**
 * 获取截止时间信息的 API
 * GET /api/deadline
 */
export async function GET() {
  const deadline = process.env.SUBMISSION_DEADLINE

  if (!deadline) {
    return NextResponse.json({
      hasDeadline: false,
      deadline: null,
      isExpired: false
    })
  }

  try {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const isExpired = now > deadlineDate

    return NextResponse.json({
      hasDeadline: true,
      deadline: deadlineDate.toISOString(),
      isExpired,
      timeRemaining: deadlineDate.getTime() - now.getTime()
    })
  } catch (error) {
    console.error('解析截止时间失败:', error)
    return NextResponse.json({
      hasDeadline: false,
      deadline: null,
      isExpired: false,
      error: 'Invalid deadline format'
    }, { status: 500 })
  }
}

