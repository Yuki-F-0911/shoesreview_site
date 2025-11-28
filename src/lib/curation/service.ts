import { CuratedSourceStatus, CuratedSourceType } from '@prisma/client'
import { prisma } from '@/lib/prisma/client'
import { searchWebArticles } from '@/lib/ai/web-search'
import { searchYouTubeVideos } from '@/lib/ai/youtube-search'
import type { RefreshCurationInput } from '@/lib/validations/curation'

const SOCIAL_DOMAINS = ['x.com', 'twitter.com', 'instagram.com', 'threads.net', 'facebook.com']
const MARKETPLACE_DOMAINS = [
  'nike.com',
  'adidas.jp',
  'adidas.com',
  'asics.com',
  'mizunoshop.net',
  'newbalance.jp',
  'puma.com',
  'rakuten.co.jp',
  'yahoo.co.jp',
  'amazon.co.jp',
]
const OFFICIAL_KEYWORDS = ['official', 'ブランド', 'キャンペーン', 'プレスリリース']

function classifySource(hostname: string, title: string): CuratedSourceType {
  const host = hostname.toLowerCase()

  if (SOCIAL_DOMAINS.some((domain) => host.includes(domain))) {
    return CuratedSourceType.SNS
  }

  if (MARKETPLACE_DOMAINS.some((domain) => host.includes(domain))) {
    return CuratedSourceType.MARKETPLACE
  }

  if (OFFICIAL_KEYWORDS.some((keyword) => title.toLowerCase().includes(keyword))) {
    return CuratedSourceType.OFFICIAL
  }

  return CuratedSourceType.ARTICLE
}

export function reliabilityScore(type: CuratedSourceType) {
  switch (type) {
    case CuratedSourceType.OFFICIAL:
      return 0.95
    case CuratedSourceType.MARKETPLACE:
      return 0.85
    case CuratedSourceType.VIDEO:
      return 0.8
    case CuratedSourceType.SNS:
      return 0.65
    case CuratedSourceType.COMMUNITY:
      return 0.6
    default:
      return 0.75
  }
}

export async function refreshCuratedSourcesForShoe(
  shoeId: string,
  options: RefreshCurationInput = { includeVideos: true, includeWeb: true, maxResults: 12 }
) {
  const shoe = await prisma.shoe.findUnique({
    where: { id: shoeId },
    select: {
      id: true,
      brand: true,
      modelName: true,
      category: true,
      keywords: true,
      locale: true,
      region: true,
    },
  })

  if (!shoe) {
    throw new Error('Shoe not found')
  }

  const keywordSet = new Set([
    shoe.brand,
    shoe.modelName,
    shoe.category,
    ...(shoe.keywords || []),
    'ランニング',
    'レビュー',
  ])

  const language = shoe.locale?.split('-')[0] || 'ja'
  const baseQuery = `${shoe.brand} ${shoe.modelName} レビュー`

  const existingSources = await prisma.curatedSource.findMany({
    where: { shoeId },
    select: { url: true },
  })
  const existingUrls = new Set(existingSources.map((item) => item.url))

  const candidates: {
    type: CuratedSourceType
    title: string
    url: string
    excerpt?: string
    thumbnailUrl?: string
    platform: string
    author?: string
    metadata?: any
  }[] = []

  if (options.includeWeb !== false) {
    const webResults = await searchWebArticles(`${baseQuery} 最新`, options.maxResults)

    webResults.items.forEach((item) => {
      try {
        const urlObj = new URL(item.url)
        const type = classifySource(urlObj.hostname, item.title)
        candidates.push({
          type,
          title: item.title,
          url: item.url,
          excerpt: item.snippet,
          platform: urlObj.hostname,
          metadata: { source: 'serper', displayUrl: item.displayUrl },
        })
      } catch (error) {
        console.warn('Failed to parse URL for curated source', error)
      }
    })
  }

  if (options.includeVideos !== false) {
    const videoResults = await searchYouTubeVideos(`${shoe.brand} ${shoe.modelName} レビュー`, Math.min(6, options.maxResults))
    videoResults.items.forEach((item) => {
      candidates.push({
        type: CuratedSourceType.VIDEO,
        title: item.title,
        url: item.url,
        excerpt: item.description,
        thumbnailUrl: item.thumbnailUrl,
        platform: 'youtube.com',
        author: item.channelTitle,
        metadata: { publishedAt: item.publishedAt },
      })
    })
  }

  const newSources = candidates
    .filter((item) => !existingUrls.has(item.url))
    .slice(0, options.maxResults)
    .map((item) => ({
      shoeId,
      type: item.type,
      platform: item.platform,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      author: item.author,
      language,
      country: shoe.region,
      thumbnailUrl: item.thumbnailUrl,
      tags: Array.from(keywordSet).slice(0, 8),
      status: CuratedSourceStatus.PUBLISHED,
      reliability: reliabilityScore(item.type),
      metadata: item.metadata,
    }))

  if (newSources.length === 0) {
    return { created: 0 }
  }

  await prisma.curatedSource.createMany({
    data: newSources,
    skipDuplicates: true,
  })

  return { created: newSources.length }
}

export async function getCuratedSourcesForShoe(shoeId: string, type?: CuratedSourceType) {
  return prisma.curatedSource.findMany({
    where: {
      shoeId,
      status: CuratedSourceStatus.PUBLISHED,
      ...(type ? { type } : {}),
    },
    orderBy: [
      { reliability: 'desc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 30,
  })
}


