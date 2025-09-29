import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取并验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    // 获取用户信息（任何登录用户都可以查看其他用户的基本信息）
    const user = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
        skillLevel: true,
        avatar: true,
        // 只有查看自己的信息时才返回邮箱
        email: decoded.userId === params.id,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取并验证JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any

    // 检查用户是否有权限更新这个用户信息（只能更新自己的信息）
    if (decoded.userId !== params.id) {
      return NextResponse.json(
        { message: '无权限访问' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nickname, role, skillLevel, email } = body

    console.log('Update user request body:', body)

    // 验证输入
    if (!nickname || !role || !skillLevel) {
      return NextResponse.json(
        { message: '昵称、身份和技术水平不能为空' },
        { status: 400 }
      )
    }

    // 防止普通用户将自己的角色改为管理员
    if (role === 'ADMIN' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '无权限设置为管理员角色' },
        { status: 403 }
      )
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          NOT: {
            id: params.id
          }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { message: '该邮箱已被其他用户使用' },
          { status: 409 }
        )
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: {
        id: params.id
      },
      data: {
        nickname,
        role,
        skillLevel,
        email: email || null
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
        skillLevel: true,
        email: true,
        avatar: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { message: '更新用户信息失败' },
      { status: 500 }
    )
  }
}