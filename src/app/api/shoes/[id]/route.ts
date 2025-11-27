import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shoe = await prisma.shoe.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          where: {
            isPublished: true,
            isDraft: false,
          },
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
          },
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

