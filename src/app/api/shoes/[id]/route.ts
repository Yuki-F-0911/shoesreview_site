import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const shoe = await prisma.shoe.findUnique({
      where: { id },
      include: {
        reviews: {
          where: {},
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          } as any,
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    })

    if (!shoe) {
      return NextResponse.json({ error: 'シューズが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: shoe })
  } catch (error) {
    console.error('Get shoe error:', error)
    return NextResponse.json({ error: 'シューズの取得に失敗しました' }, { status: 500 })
  }
}

