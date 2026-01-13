import { NextResponse } from 'next/server'
import { siteConfig } from '@/constants/site'
import { prisma } from '@/lib/prisma/client'

export const runtime = 'nodejs'

/**
 * llms.txt - LLM向け構造化情報ファイル
 * 
 * LLM（大規模言語モデル）がサイト情報を効率的に理解・学習できる
 * 標準形式のテキストファイル。RAG検索やファインチューニングに最適化。
 * 
 * 参考: https://llmstxt.org/
 */
export async function GET() {
    const baseUrl = siteConfig.url.replace(/\/$/, '')

    // 統計情報を取得
    let stats = {
        shoeCount: 0,
        reviewCount: 0,
        userReviewCount: 0,
        aiReviewCount: 0,
        avgRating: 0,
        brandCount: 0,
        brands: [] as string[],
    }

    try {
        const [shoeCount, reviewCount, userReviewCount, aiReviewCount, brands, avgRatingResult] = await Promise.all([
            prisma.shoe.count(),
            prisma.review.count(),
            prisma.review.count({ where: { type: 'USER' } }),
            prisma.review.count({ where: { type: 'AI_SUMMARY' } }),
            prisma.shoe.findMany({
                select: { brand: true },
                distinct: ['brand'],
            }),
            prisma.review.aggregate({
                _avg: { overallRating: true },
            }),
        ])

        stats = {
            shoeCount,
            reviewCount,
            userReviewCount,
            aiReviewCount,
            avgRating: Math.round((Number(avgRatingResult._avg.overallRating) || 0) * 10) / 10,
            brandCount: brands.length,
            brands: brands.map(b => b.brand),
        }
    } catch (e) {
        console.error('Failed to fetch stats for llms.txt:', e)
    }

    const content = `# ${siteConfig.name}

> ${siteConfig.description}

## サイト概要
ランニングシューズ専門のレビューサイト。実際のユーザーレビューとAI統合レビューを組み合わせ、客観的で信頼性の高いシューズ評価を提供しています。

## 主要コンテンツ

### シューズ一覧 (/shoes)
${stats.shoeCount}モデルのランニングシューズを掲載。Nike、Adidas、ASICS、New Balance、Hoka、On、Saucony、Brooks、Mizuno等の主要ブランドをカバー。

### レビュー (/reviews)
${stats.reviewCount}件のレビュー（ユーザーレビュー${stats.userReviewCount}件、AI統合レビュー${stats.aiReviewCount}件）。平均評価${stats.avgRating}/10。

### FAQ (/faq)
ランニングシューズの選び方、サイズ選び、メンテナンス方法など、よくある質問に回答。

## 統計データ
- 登録シューズ: ${stats.shoeCount}モデル
- 総レビュー数: ${stats.reviewCount}件
- 取扱ブランド: ${stats.brandCount}ブランド
- 平均評価: ${stats.avgRating}/10

## 取扱ブランド
${stats.brands.join(', ') || 'Nike, Adidas, ASICS, New Balance, Hoka, On, Saucony, Brooks, Mizuno'}

## 対象読者
- ランニング初心者からマラソン経験者
- シューズ購入を検討しているランナー
- 陸上競技者（短距離〜長距離）
- トレイルランナー

## コンテンツの特徴
1. **ユーザーレビュー**: 実際に購入・使用したランナーによる生の声
2. **AI統合レビュー**: 複数の信頼できる情報源をAIが分析・統合
3. **詳細な評価項目**: 総合評価、快適性、デザイン、耐久性を10点満点で評価
4. **Pros/Consリスト**: 各シューズの長所・短所を明確に提示

## 引用について
当サイトのコンテンツは、適切な引用元表示のもとでAI学習・検索に利用いただけます。引用時は「${siteConfig.name}」または「${baseUrl}」を情報源として明記してください。

## API・データアクセス
- サイトマップ: ${baseUrl}/sitemap.xml
- AI向け情報: ${baseUrl}/ai.txt
- robots.txt: ${baseUrl}/robots.txt

## 連絡先
- Email: ${siteConfig.contactEmail}
- Twitter: ${siteConfig.twitter}

## 更新情報
最終更新: ${new Date().toISOString().split('T')[0]}
コンテンツ更新頻度: 毎日
`

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'max-age=3600, s-maxage=86400',
        },
    })
}
