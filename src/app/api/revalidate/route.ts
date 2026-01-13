import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * オンデマンド再検証API
 * 
 * レビュー投稿やデータ更新時に、指定されたパスのキャッシュを即座に無効化し、
 * 次回アクセス時に最新のコンテンツを配信できるようにします。
 * 
 * 使用例:
 * POST /api/revalidate
 * Body: { "paths": ["/", "/reviews", "/shoes/xxx"], "secret": "xxx" }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { paths, tags, secret } = body

        // シークレットキー検証（環境変数が設定されている場合のみ）
        const revalidateSecret = process.env.REVALIDATE_SECRET
        if (revalidateSecret && secret !== revalidateSecret) {
            return NextResponse.json(
                { error: 'Invalid revalidation secret' },
                { status: 401 }
            )
        }

        const revalidatedPaths: string[] = []
        const revalidatedTags: string[] = []

        // パスの再検証
        if (Array.isArray(paths)) {
            for (const path of paths) {
                if (typeof path === 'string') {
                    revalidatePath(path)
                    revalidatedPaths.push(path)
                }
            }
        }

        // タグの再検証（オプション）
        if (Array.isArray(tags)) {
            for (const tag of tags) {
                if (typeof tag === 'string') {
                    revalidateTag(tag)
                    revalidatedTags.push(tag)
                }
            }
        }

        return NextResponse.json({
            success: true,
            revalidated: {
                paths: revalidatedPaths,
                tags: revalidatedTags,
            },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Revalidation error:', error)
        return NextResponse.json(
            { error: 'Failed to revalidate', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
