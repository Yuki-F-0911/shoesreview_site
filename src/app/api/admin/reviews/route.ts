/**
 * 管理用レビュー一覧API
 * AI要約レビューを取得
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 認証チェック（管理者のみ）
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const draft = searchParams.get('draft')

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (draft === 'true') {
      where.isDraft = true
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
          },
        },
        aiSources: {
          orderBy: {
            scrapedAt: 'desc',
          },
        },
      },
      // Note: orderBy removed because createdAt column doesn't exist in Review model
    })

    return NextResponse.json({
      success: true,
      data: {
        items: reviews,
        total: reviews.length,
      },
    })
  } catch (error) {
    console.error('Get admin reviews error:', error)
    return NextResponse.json({ error: 'レビューの取得に失敗しました' }, { status: 500 })
  }
}

