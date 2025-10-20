import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, planetNumber, role, skillLevel, email, password } = body

    // 去除账号和密码前后空格
    const trimmedPlanetNumber = planetNumber?.trim() || ''
    const trimmedPassword = password?.trim() || ''

    // 检查必填字段
    if (!nickname || !trimmedPlanetNumber || !role || !skillLevel || !trimmedPassword) {
      return NextResponse.json(
        { message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 检查星球编号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { planetNumber: trimmedPlanetNumber }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: '该星球编号已被注册' },
        { status: 409 }
      )
    }

    // 如果提供了邮箱，检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { message: '该邮箱已被注册' },
          { status: 409 }
        )
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(trimmedPassword, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        nickname,
        planetNumber: trimmedPlanetNumber,
        role,
        skillLevel,
        email: email || null,
        password: hashedPassword
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
        skillLevel: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    })

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        planetNumber: user.planetNumber,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      user,
      token,
      message: '注册成功'
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: '注册失败，请重试' },
      { status: 500 }
    )
  }
}