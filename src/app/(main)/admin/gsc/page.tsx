'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface AnalyticsRow {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface DailyData {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface AnalyticsData {
  period: { startDate: string; endDate: string; days: number }
  summary: {
    totalClicks: number
    totalImpressions: number
    avgCtr: number
    avgPosition: number
  }
  daily: DailyData[]
  rows: AnalyticsRow[]
}

interface CoveragePageData {
  url: string
  path: string
  type: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface CoverageData {
  sitemaps: Array<{
    path: string
    lastSubmitted: string | null
    warnings: number
    errors: number
  }>
  summary: {
    totalIndexedPages: number
    byType: { shoe: number; review: number; other: number }
    topPages: CoveragePageData[]
    lowPerformers: CoveragePageData[]
  }
}

interface InspectionResult {
  verdict: string
  coverageState: string
  indexingState: string
  lastCrawlTime: string | null
  pageFetchState: string
}

type Tab = 'keywords' | 'pages' | 'coverage'

export default function GSCDashboardPage() {
  const [tab, setTab] = useState<Tab>('keywords')
  const [days, setDays] = useState(28)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [coverage, setCoverage] = useState<CoverageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspectUrl, setInspectUrl] = useState('')
  const [inspection, setInspection] = useState<InspectionResult | null>(null)
  const [inspecting, setInspecting] = useState(false)

  const fetchAnalytics = useCallback(async (dimension: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/gsc/analytics?days=${days}&dimension=${dimension}&limit=50`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error)
      }
      setAnalytics(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [days])

  const fetchCoverage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/gsc/coverage')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details || data.error)
      }
      setCoverage(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'keywords') fetchAnalytics('query')
    else if (tab === 'pages') fetchAnalytics('page')
    else if (tab === 'coverage') fetchCoverage()
  }, [tab, days, fetchAnalytics, fetchCoverage])

  const handleInspect = async () => {
    if (!inspectUrl) return
    setInspecting(true)
    setInspection(null)
    try {
      const res = await fetch('/api/admin/gsc/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inspectUrl }),
      })
      if (!res.ok) throw new Error('URL検査に失敗しました')
      setInspection(await res.json())
    } catch {
      setError('URL検査に失敗しました')
    } finally {
      setInspecting(false)
    }
  }

  const verdictColor = (verdict: string) => {
    if (verdict === 'PASS') return 'bg-green-100 text-green-700'
    if (verdict === 'PARTIAL') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Search Console</h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={7}>7日間</option>
            <option value={28}>28日間</option>
            <option value={90}>90日間</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {([
          ['keywords', '検索キーワード'],
          ['pages', 'ページ別'],
          ['coverage', 'インデックス'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {analytics && (tab === 'keywords' || tab === 'pages') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{analytics.summary.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-slate-500">クリック数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{analytics.summary.totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-slate-500">表示回数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{(analytics.summary.avgCtr * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-500">平均CTR</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{analytics.summary.avgPosition.toFixed(1)}</p>
              <p className="text-xs text-slate-500">平均掲載順位</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily trend (simple bar chart) */}
      {analytics && (tab === 'keywords' || tab === 'pages') && analytics.daily.length > 0 && (
        <Card>
          <CardHeader><CardTitle>日別クリック数</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {analytics.daily.map((d) => {
                const maxClicks = Math.max(...analytics.daily.map((dd) => dd.clicks), 1)
                const height = (d.clicks / maxClicks) * 100
                return (
                  <div
                    key={d.date}
                    className="flex-1 bg-indigo-400 hover:bg-indigo-500 rounded-t transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${d.date}: ${d.clicks}クリック`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>{analytics.daily[0]?.date}</span>
              <span>{analytics.daily[analytics.daily.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords / Pages table */}
      {analytics && (tab === 'keywords' || tab === 'pages') && (
        <Card>
          <CardHeader>
            <CardTitle>{tab === 'keywords' ? '検索キーワード' : 'ページ別パフォーマンス'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-slate-400">読み込み中...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">
                        {tab === 'keywords' ? 'キーワード' : 'ページ'}
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">クリック</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">表示</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">CTR</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">順位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-800 max-w-xs truncate">
                          {tab === 'pages' ? row.key.replace(/https?:\/\/[^/]+/, '') : row.key}
                        </td>
                        <td className="text-right py-2 px-3 font-medium text-indigo-600">{row.clicks}</td>
                        <td className="text-right py-2 px-3 text-slate-600">{row.impressions.toLocaleString()}</td>
                        <td className="text-right py-2 px-3 text-slate-600">{(row.ctr * 100).toFixed(1)}%</td>
                        <td className="text-right py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            row.position <= 10 ? 'bg-green-50 text-green-700'
                            : row.position <= 20 ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.position.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analytics.rows.length === 0 && (
                  <p className="text-center py-8 text-slate-400">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coverage tab */}
      {tab === 'coverage' && (
        <>
          {loading ? (
            <p className="text-center py-8 text-slate-400">読み込み中...</p>
          ) : coverage && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{coverage.summary.totalIndexedPages}</p>
                    <p className="text-xs text-slate-500">インデックス済み</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{coverage.summary.byType.shoe}</p>
                    <p className="text-xs text-slate-500">シューズページ</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{coverage.summary.byType.review}</p>
                    <p className="text-xs text-slate-500">レビューページ</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{coverage.summary.byType.other}</p>
                    <p className="text-xs text-slate-500">その他</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sitemaps */}
              {coverage.sitemaps.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>サイトマップ</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {coverage.sitemaps.map((s) => (
                        <div key={s.path} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-700 truncate">{s.path}</span>
                          <div className="flex items-center gap-3">
                            {s.errors > 0 && <Badge variant="destructive">{s.errors} errors</Badge>}
                            {s.warnings > 0 && <Badge variant="secondary">{s.warnings} warnings</Badge>}
                            {s.lastSubmitted && (
                              <span className="text-xs text-slate-400">
                                {new Date(s.lastSubmitted).toLocaleDateString('ja-JP')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top pages */}
              <Card>
                <CardHeader><CardTitle>パフォーマンス上位ページ</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 text-slate-500 font-medium">ページ</th>
                          <th className="text-left py-2 px-3 text-slate-500 font-medium">種別</th>
                          <th className="text-right py-2 px-3 text-slate-500 font-medium">クリック</th>
                          <th className="text-right py-2 px-3 text-slate-500 font-medium">表示</th>
                          <th className="text-right py-2 px-3 text-slate-500 font-medium">順位</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverage.summary.topPages.map((p, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-800 max-w-xs truncate">{p.path || '/'}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline">{p.type}</Badge>
                            </td>
                            <td className="text-right py-2 px-3 font-medium text-indigo-600">{p.clicks}</td>
                            <td className="text-right py-2 px-3 text-slate-600">{p.impressions.toLocaleString()}</td>
                            <td className="text-right py-2 px-3 text-slate-600">{p.position.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Low performers */}
              {coverage.summary.lowPerformers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>改善候補（高表示・低CTR）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500 mb-3">
                      表示回数は多いがクリック率が1%未満のページ。タイトル・ディスクリプションの改善が有効です。
                    </p>
                    <div className="space-y-2">
                      {coverage.summary.lowPerformers.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                          <span className="text-sm text-slate-700 truncate flex-1">{p.path}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500">{p.impressions.toLocaleString()}表示</span>
                            <span className="text-red-600 font-medium">CTR {(p.ctr * 100).toFixed(2)}%</span>
                            <span className="text-slate-500">順位 {p.position.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* URL Inspection */}
              <Card>
                <CardHeader><CardTitle>URL検査</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={inspectUrl}
                      onChange={(e) => setInspectUrl(e.target.value)}
                      placeholder="https://example.com/shoes/..."
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <Button onClick={handleInspect} disabled={inspecting || !inspectUrl}>
                      {inspecting ? '検査中...' : '検査'}
                    </Button>
                  </div>
                  {inspection && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">判定</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${verdictColor(inspection.verdict)}`}>
                          {inspection.verdict}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">インデックス状態</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">{inspection.indexingState}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">ページ取得</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">{inspection.pageFetchState}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">カバレッジ</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">{inspection.coverageState}</p>
                      </div>
                      {inspection.lastCrawlTime && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500">最終クロール</p>
                          <p className="text-sm font-medium text-slate-800 mt-1">
                            {new Date(inspection.lastCrawlTime).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
