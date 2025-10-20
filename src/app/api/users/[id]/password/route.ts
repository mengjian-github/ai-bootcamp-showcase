import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'

/**
 * 修改用户密码 API
 * 仅管理员可调用
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const admin = requireAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { message: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPassword } = body

    // 去除密码前后空格
    const trimmedPassword = newPassword?.trim() || ''

    // 验证新密码
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return NextResponse.json(
        { message: '新密码至少需要6个字符' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, nickname: true, planetNumber: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(trimmedPassword, 12)

    // 更新用户密码
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      message: '密码修改成功',
      user: {
        nickname: user.nickname,
        planetNumber: user.planetNumber
      }
    })

  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json(
      { message: '修改密码失败，请重试' },
      { status: 500 }
    )
  }
}

