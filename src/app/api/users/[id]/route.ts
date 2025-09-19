import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
    const { nickname, role, email } = body

    // 验证输入
    if (!nickname || !role) {
      return NextResponse.json(
        { message: '昵称和身份不能为空' },
        { status: 400 }
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
        email: email || null
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
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