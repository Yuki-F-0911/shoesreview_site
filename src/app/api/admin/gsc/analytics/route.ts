import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { isAdminEmail } from '@/lib/auth/permissions'
import { fetchSearchAnalytics } from '@/lib/google/search-console'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '28')
  const dimension = searchParams.get('dimension') || 'query'
  const limit = parseInt(searchParams.get('limit') || '50')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  try {
    const validDimensions = ['query', 'page', 'device', 'country', 'date'] as const
    const dim = validDimensions.includes(dimension as any)
      ? (dimension as (typeof validDimensions)[number])
      : 'query'

    const result = await fetchSearchAnalytics({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: [dim],
      rowLimit: limit,
    })

    // Also fetch totals (no dimensions)
    const totals = await fetchSearchAnalytics({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['date'],
      rowLimit: days,
    })

    const totalClicks = totals.rows.reduce((sum, r) => sum + r.clicks, 0)
    const totalImpressions = totals.rows.reduce((sum, r) => sum + r.impressions, 0)
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
    const avgPosition = totals.rows.length > 0
      ? totals.rows.reduce((sum, r) => sum + r.position, 0) / totals.rows.length
      : 0

    return NextResponse.json({
      period: { startDate: formatDate(startDate), endDate: formatDate(endDate), days },
      summary: {
        totalClicks,
        totalImpressions,
        avgCtr,
        avgPosition,
      },
      daily: totals.rows.map((r) => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      rows: result.rows.map((r) => ({
        key: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
    })
  } catch (error: any) {
    console.error('GSC Analytics API error:', error?.message || error)
    return NextResponse.json(
      { error: 'GSCデータの取得に失敗しました', details: error?.message },
      { status: 500 }
    )
  }
}
