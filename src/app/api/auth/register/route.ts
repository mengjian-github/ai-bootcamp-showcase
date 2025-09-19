import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, planetNumber, role, email, password } = body

    // 检查必填字段
    if (!nickname || !planetNumber || !role || !password) {
      return NextResponse.json(
        { message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 检查星球编号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { planetNumber }
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
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        nickname,
        planetNumber,
        role,
        email: email || null,
        password: hashedPassword
      },
      select: {
        id: true,
        nickname: true,
        planetNumber: true,
        role: true,
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