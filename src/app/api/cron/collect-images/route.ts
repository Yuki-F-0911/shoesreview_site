import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { searchImages } from '@/lib/ai/web-search'

const prisma = new PrismaClient()

// 認証チェック
function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (authHeader === `Bearer ${cronSecret}`) {
        return true
    }

    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    if (secret === cronSecret) {
        return true
    }

    return false
}

// 不適切な画像URLをフィルター
function isBadImage(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.includes('logo') ||
        lower.includes('icon') ||
        lower.includes('symbol') ||
        lower.includes('profile') ||
        lower.includes('header') ||
        lower.includes('avatar') ||
        lower.includes('default') ||
        lower.includes('svg') ||
        lower.includes('transparent') ||
        lower.includes('sprite') ||
        (lower.includes('amazon') && (lower.includes('play-button') || lower.includes('badge')))
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        console.log('Starting image collection via Cron...')

        // 画像がないシューズを取得（最大20件）
        const allShoes = await prisma.shoe.findMany({
            orderBy: { createdAt: 'desc' }
        })

        const shoes = allShoes.filter(s => s.imageUrls.length === 0)
        const targetShoes = shoes.slice(0, 20)

        console.log(`Processing ${targetShoes.length} shoes without images (Total missing: ${shoes.length})...`)

        const results = {
            processed: 0,
            success: 0,
            failed: 0,
            details: [] as { shoe: string; status: string; imageUrl?: string; error?: string }[]
        }

        for (const shoe of targetShoes) {
            const shoeName = `${shoe.brand} ${shoe.modelName}`
            console.log(`Processing: ${shoeName}`)

            const queries = [
                `${shoe.brand} ${shoe.modelName} shoe product image`,
                `${shoe.brand} ${shoe.modelName} running shoe white background`,
                `${shoe.brand} ${shoe.modelName} official`,
                `${shoe.brand} ${shoe.modelName}`
            ]

            let foundImage: string | null = null

            for (const query of queries) {
                if (foundImage) break

                console.log(`  Trying query: "${query}"`)
                try {
                    const searchResults = await searchImages(query, 3)

                    for (const item of searchResults.items) {
                        if (!isBadImage(item.url)) {
                            if (item.url.match(/\.(jpg|jpeg|png|webp)$/i)) {
                                foundImage = item.url
                                console.log(`  -> SELECTED: ${foundImage}`)
                                break
                            }
                        }
                    }
                } catch (e) {
                    console.error(`  -> Error: ${e}`)
                }

                // クエリ間の待機
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            if (foundImage) {
                await prisma.shoe.update({
                    where: { id: shoe.id },
                    data: { imageUrls: [foundImage] }
                })
                results.details.push({ shoe: shoeName, status: 'success', imageUrl: foundImage })
                results.success++
            } else {
                results.details.push({ shoe: shoeName, status: 'failed', error: 'No suitable image found' })
                results.failed++
            }

            results.processed++
        }

        console.log(`Image collection completed. Success: ${results.success}, Failed: ${results.failed}`)

        return NextResponse.json({
            success: true,
            message: 'Image collection completed',
            totalMissing: shoes.length,
            results
        })

    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

export const runtime = 'nodejs'
export const maxDuration = 300
