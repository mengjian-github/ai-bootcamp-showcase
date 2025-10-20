import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'

/**
 * 用户修改自己的密码
 * 需要提供旧密码进行验证
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const user = requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { message: '需要登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    // 去除密码前后空格
    const trimmedOldPassword = oldPassword?.trim() || ''
    const trimmedNewPassword = newPassword?.trim() || ''

    // 验证必填字段
    if (!trimmedOldPassword || !trimmedNewPassword) {
      return NextResponse.json(
        { message: '旧密码和新密码不能为空' },
        { status: 400 }
      )
    }

    // 验证新密码长度
    if (trimmedNewPassword.length < 6) {
      return NextResponse.json(
        { message: '新密码至少需要6个字符' },
        { status: 400 }
      )
    }

    // 获取用户完整信息（包括密码）
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        nickname: true,
        password: true
      }
    })

    if (!userWithPassword) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    // 验证旧密码
    const isOldPasswordCorrect = await bcrypt.compare(trimmedOldPassword, userWithPassword.password)
    if (!isOldPasswordCorrect) {
      return NextResponse.json(
        { message: '旧密码不正确' },
        { status: 401 }
      )
    }

    // 检查新密码是否与旧密码相同
    const isSamePassword = await bcrypt.compare(trimmedNewPassword, userWithPassword.password)
    if (isSamePassword) {
      return NextResponse.json(
        { message: '新密码不能与旧密码相同' },
        { status: 400 }
      )
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(trimmedNewPassword, 12)

    // 更新密码
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      message: '密码修改成功',
      user: {
        nickname: userWithPassword.nickname
      }
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { message: '修改密码失败，请重试' },
      { status: 500 }
    )
  }
}

