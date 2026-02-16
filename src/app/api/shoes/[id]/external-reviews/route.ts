import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

export const revalidate = 300 // 5分ごとに再検証

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const externalReviews = await prisma.externalReview.findMany({
            where: { shoeId: params.id },
            orderBy: { collectedAt: 'desc' },
            take: 30,
            select: {
                id: true,
                platform: true,
                sourceUrl: true,
                sourceTitle: true,
                authorName: true,
                snippet: true,
                aiSummary: true,
                language: true,
                sentiment: true,
                keyPoints: true,
                publishedAt: true,
                collectedAt: true,
            },
        })

        return NextResponse.json({
            reviews: externalReviews,
            total: externalReviews.length,
        })
    } catch (error) {
        console.error('Failed to fetch external reviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch external reviews', reviews: [], total: 0 },
            { status: 500 }
        )
    }
}
