import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { isAdminEmail } from '@/lib/auth/permissions'
import { inspectUrl, fetchSitemaps, fetchSearchAnalytics } from '@/lib/google/search-console'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const baseUrl = SITE_URL.replace(/\/$/, '')

  try {
    // Fetch sitemaps info
    let sitemaps: Awaited<ReturnType<typeof fetchSitemaps>> = []
    try {
      sitemaps = await fetchSitemaps()
    } catch (e: any) {
      console.error('Failed to fetch sitemaps:', e?.message)
    }

    // Fetch page-level analytics to identify indexed pages
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 28)
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const pageData = await fetchSearchAnalytics({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['page'],
      rowLimit: 500,
    })

    // Categorize pages
    const pages = pageData.rows.map((r) => {
      const url = r.keys[0]
      const path = url.replace(baseUrl, '')
      let type = 'other'
      if (path.startsWith('/shoes/')) type = 'shoe'
      else if (path.startsWith('/reviews/')) type = 'review'
      else if (path === '/' || path === '') type = 'home'
      else if (path.startsWith('/search')) type = 'search'

      return {
        url,
        path,
        type,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }
    })

    const summary = {
      totalIndexedPages: pages.length,
      byType: {
        shoe: pages.filter((p) => p.type === 'shoe').length,
        review: pages.filter((p) => p.type === 'review').length,
        other: pages.filter((p) => p.type === 'other').length,
      },
      topPages: pages
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20),
      lowPerformers: pages
        .filter((p) => p.impressions > 10 && p.ctr < 0.01)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
    }

    return NextResponse.json({
      sitemaps,
      pages,
      summary,
    })
  } catch (error: any) {
    console.error('GSC Coverage API error:', error?.message || error)
    return NextResponse.json(
      { error: 'インデックスカバレッジの取得に失敗しました', details: error?.message },
      { status: 500 }
    )
  }
}

// POST: Inspect a specific URL
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { url } = body as { url?: string }

    if (!url) {
      return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })
    }

    const result = await inspectUrl(url)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GSC URL Inspection error:', error?.message || error)
    return NextResponse.json(
      { error: 'URL検査に失敗しました', details: error?.message },
      { status: 500 }
    )
  }
}
