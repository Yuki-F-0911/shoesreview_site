/**
 * データベースバックアップ Cron Job
 * 毎日5:00 UTCに実行し、Google Sheetsにデータをエクスポート
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { writeToSheet, updateBackupMetadata } from '@/lib/google/sheets'

// Vercel Cron認証
const CRON_SECRET = process.env.CRON_SECRET

function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${CRON_SECRET}`) {
        return true
    }
    // Vercel Cronからのリクエストを許可
    const vercelCron = request.headers.get('x-vercel-cron')
    if (vercelCron) {
        return true
    }
    return false
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('Starting database backup to Google Sheets...')

        // Reviews のバックアップ
        const reviews = await prisma.review.findMany({
            include: {
                shoe: { select: { brand: true, modelName: true } },
                user: { select: { displayName: true, email: true } },
            },
            orderBy: { postedAt: 'desc' },
        })

        const reviewHeaders = [
            'ID', 'タイプ', 'タイトル', 'シューズブランド', 'シューズモデル',
            'ユーザー名', '総合評価', '投稿日時', '内容', '良い点', '悪い点',
            '推奨対象', 'サイズ', 'オノマトペ',
        ]

        const reviewRows = reviews.map((r) => [
            r.id,
            r.type,
            r.title || '',
            r.shoe?.brand || '',
            r.shoe?.modelName || '',
            r.user?.displayName || 'AI',
            r.overallRating ? String(r.overallRating) : '',
            r.postedAt?.toISOString() || '',
            r.content || '',
            r.pros?.join(', ') || '',
            r.cons?.join(', ') || '',
            r.recommendedFor || '',
            r.purchaseSize || '',
            r.onomatopoeia || '',
        ])

        await writeToSheet('Reviews', reviewHeaders, reviewRows)
        console.log(`Backed up ${reviews.length} reviews`)

        // Shoes のバックアップ
        const shoes = await prisma.shoe.findMany({
            orderBy: { createdAt: 'desc' },
        })

        const shoeHeaders = [
            'ID', 'ブランド', 'モデル名', 'カテゴリー', '公式価格',
            '発売年', '画像URL', '作成日時',
        ]

        const shoeRows = shoes.map((s) => [
            s.id,
            s.brand,
            s.modelName,
            s.category || '',
            s.officialPrice ? String(s.officialPrice) : '',
            s.releaseYear ? String(s.releaseYear) : '',
            s.imageUrls?.join(', ') || '',
            s.createdAt?.toISOString() || '',
        ])

        await writeToSheet('Shoes', shoeHeaders, shoeRows)
        console.log(`Backed up ${shoes.length} shoes`)

        // Users のバックアップ（個人情報を除く）
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                displayName: true,
                createdAt: true,
                runnerPersonalBest: true,
                runnerExpertise: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        const userHeaders = [
            'ID', 'ユーザー名', '表示名', '作成日時', '自己ベスト', '専門種目',
        ]

        const userRows = users.map((u) => [
            u.id,
            u.username,
            u.displayName,
            u.createdAt?.toISOString() || '',
            u.runnerPersonalBest || '',
            u.runnerExpertise?.join(', ') || '',
        ])

        await writeToSheet('Users', userHeaders, userRows)
        console.log(`Backed up ${users.length} users`)

        // メタデータ更新
        await updateBackupMetadata()

        return NextResponse.json({
            success: true,
            message: 'Backup completed successfully',
            stats: {
                reviews: reviews.length,
                shoes: shoes.length,
                users: users.length,
                timestamp: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Backup error:', error)
        return NextResponse.json(
            {
                error: 'Backup failed',
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
