import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

    // 检查是否为管理员
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPlanetNumber } = body

    // 验证输入
    if (!newPlanetNumber || newPlanetNumber.trim() === '') {
      return NextResponse.json(
        { message: '星球编号不能为空' },
        { status: 400 }
      )
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查新的星球编号是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        planetNumber: newPlanetNumber.trim(),
        NOT: {
          id: params.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: '该星球编号已被其他用户使用' },
        { status: 409 }
      )
    }

    // 更新星球编号
    const updatedUser = await prisma.user.update({
      where: {
        id: params.id
      },
      data: {
        planetNumber: newPlanetNumber.trim()
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true
      }
    })

    return NextResponse.json({
      message: '星球编号修改成功',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating planet number:', error)
    return NextResponse.json(
      { message: '修改星球编号失败，请重试' },
      { status: 500 }
    )
  }
}

