import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

// 配置运行时
export const runtime = 'nodejs'
export const maxDuration = 45

const prisma = new PrismaClient()

export async function DELETE(
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

    // 获取作品信息以验证权限
    const project = await prisma.project.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        authorId: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: '作品不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否有权限删除这个作品（只能删除自己的作品，或者管理员可以删除任何作品）
    if (project.authorId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '无权限删除此作品' },
        { status: 403 }
      )
    }

    // 删除作品（级联删除相关的投票记录）
    await prisma.project.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: '作品删除成功' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { message: '删除作品失败' },
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

    // 获取作品信息以验证权限
    const project = await prisma.project.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        authorId: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: '作品不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否有权限编辑这个作品（只能编辑自己的作品，或者管理员可以编辑任何作品）
    if (project.authorId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '无权限编辑此作品' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      projectUrl,
      htmlFile,
      coverImage,
      bootcampId,
      isApproved
    } = body

    console.log('Update request body:', body)

    // 构建更新数据
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (projectUrl !== undefined) updateData.projectUrl = projectUrl
    if (htmlFile !== undefined) updateData.htmlFile = htmlFile
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (bootcampId !== undefined) updateData.bootcampId = bootcampId

    // 只有管理员可以修改审核状态
    if (isApproved !== undefined && decoded.role === 'ADMIN') {
      updateData.isApproved = isApproved
    }

    console.log('Update data to be applied:', updateData)

    // 更新作品
    const updatedProject = await prisma.project.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        bootcamp: {
          select: {
            id: true,
            name: true
          }
        },
        author: {
          select: {
            id: true,
            nickname: true,
            planetNumber: true,
            role: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { message: '更新作品失败' },
      { status: 500 }
    )
  }
}