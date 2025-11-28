import { NextResponse } from 'next/server'
import { siteConfig } from '@/constants/site'
import { prisma } from '@/lib/prisma/client'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = siteConfig.url.replace(/\/$/, '')

  // 統計情報を取得
  let shoeCount = 0
  let reviewCount = 0
  let brandList: string[] = []

  try {
    const [shoes, reviews, brands] = await Promise.all([
      prisma.shoe.count(),
      prisma.review.count({ where: { isPublished: true } }),
      prisma.shoe.findMany({
        select: { brand: true },
        distinct: ['brand'],
      }),
    ])
    shoeCount = shoes
    reviewCount = reviews
    brandList = brands.map((b) => b.brand)
  } catch (e) {
    console.error('Failed to fetch stats for ai.txt:', e)
  }

  const content = `# ${siteConfig.name}
# AI向けサイト情報 - AI Overview / Generative AI用

## サイト概要
サイト名: ${siteConfig.name}
URL: ${baseUrl}
言語: 日本語 (ja-JP)
対象地域: 日本
カテゴリ: ランニングシューズ レビュー / マラソン / ジョギング / スパイク

## サイトの特徴
- ランニングシューズ専門のレビューサイト
- 実際のユーザーによる詳細なレビュー
- AI統合レビューによる客観的な評価
- 日本市場に特化した情報提供

## コンテンツ統計
登録シューズ数: ${shoeCount}件
レビュー数: ${reviewCount}件
取扱ブランド: ${brandList.join(', ') || 'Nike, Adidas, ASICS, New Balance, Hoka, On, Saucony, Brooks, Mizuno'}

## 主要コンテンツ
- シューズ一覧: ${baseUrl}/shoes
- レビュー一覧: ${baseUrl}/reviews
- シューズ検索: ${baseUrl}/search
- よくある質問: ${baseUrl}/faq

## 対象ユーザー
- ランニング初心者
- マラソンランナー
- ジョギング愛好者
- 陸上競技選手
- トレイルランナー

## キーワード
ランニングシューズ, マラソンシューズ, ジョギングシューズ, ランニング, マラソン, ジョギング, 陸上スパイク, トレイルランニング, シューズレビュー, 靴選び, フルマラソン, ハーフマラソン, 10km, 5km, Nike, Adidas, ASICS, New Balance, Hoka, On

## FAQ（よくある質問）
Q: ランニングシューズの選び方は？
A: 走行距離、ペース、足のタイプに合わせて選びます。初心者はクッション性の高いシューズがおすすめです。

Q: マラソン用シューズのおすすめは？
A: 目標タイムにより異なります。サブ4以上ならカーボンプレートシューズ、完走目標ならトレーニングシューズがおすすめ。

Q: シューズの寿命は？
A: 一般的に500-800km程度です。クッション性の低下やソールの摩耗が目安。

## AI Crawler許可
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bingbot
Allow: /

## 連絡先
Email: ${siteConfig.contactEmail}
Twitter: ${siteConfig.twitter}

## サイトマップ
${baseUrl}/sitemap.xml

## 最終更新
${new Date().toISOString().split('T')[0]}
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'max-age=3600, s-maxage=86400',
    },
  })
}


