import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const bootcamps = await prisma.bootcamp.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bootcamps)
  } catch (error) {
    console.error('Error fetching bootcamps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bootcamps' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // 验证管理员权限
  const user = requireAdmin(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name, description, startDate, endDate } = body

    const bootcamp = await prisma.bootcamp.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true
      }
    })

    return NextResponse.json(bootcamp, { status: 201 })
  } catch (error) {
    console.error('Error creating bootcamp:', error)
    return NextResponse.json(
      { error: 'Failed to create bootcamp' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // 验证管理员权限
  const user = requireAdmin(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { id, name, description, startDate, endDate, isActive } = body

    const bootcamp = await prisma.bootcamp.update({
      where: { id },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive
      }
    })

    return NextResponse.json(bootcamp)
  } catch (error) {
    console.error('Error updating bootcamp:', error)
    return NextResponse.json(
      { error: 'Failed to update bootcamp' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // 验证管理员权限
  const user = requireAdmin(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bootcamp ID is required' },
        { status: 400 }
      )
    }

    await prisma.bootcamp.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Bootcamp deleted successfully' })
  } catch (error) {
    console.error('Error deleting bootcamp:', error)
    return NextResponse.json(
      { error: 'Failed to delete bootcamp' },
      { status: 500 }
    )
  }
}