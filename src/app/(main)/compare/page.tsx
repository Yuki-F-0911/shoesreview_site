import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'

import { prisma } from '@/lib/prisma/client'
import { buildRunnerProfile, getComparisonIds } from '@/lib/shoes/comparison'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'ランニングシューズ比較',
  description: '最大3足の価格、スペック、評価、実際のレビュアー条件を並べて比較できます。',
}

type PageProps = {
  searchParams: Promise<{
    shoe1?: string
    shoe2?: string
    shoe3?: string
  }>
}

const SPEC_ROWS = [
  ['weight', '重量'],
  ['drop', 'ドロップ'],
  ['stackHeight', 'スタックハイト'],
  ['midsoleTech', 'ミッドソール'],
  ['plateTech', 'プレート'],
  ['widthOptions', 'ワイズ'],
] as const

function displayValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(' / ') : '—'
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(' / ')
  }
  return String(value)
}

function specificationsOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams
  const selectedIds = getComparisonIds(params)

  const [options, foundShoes] = await Promise.all([
    prisma.shoe.findMany({
      where: { registrationStatus: 'approved' },
      select: { id: true, brand: true, modelName: true },
      orderBy: [{ brand: 'asc' }, { modelName: 'asc' }],
    }),
    selectedIds.length
      ? prisma.shoe.findMany({
          where: { id: { in: selectedIds }, registrationStatus: 'approved' },
          select: {
            id: true,
            brand: true,
            modelName: true,
            category: true,
            releaseYear: true,
            officialPrice: true,
            imageUrls: true,
            specifications: true,
            targetRunner: true,
            reviews: {
              select: {
                type: true,
                overallRating: true,
                reviewerWeeklyDistance: true,
                reviewerFootShape: true,
                usageScene: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const shoeById = new Map(foundShoes.map((shoe) => [shoe.id, shoe]))
  const shoes = selectedIds
    .map((id) => shoeById.get(id))
    .filter((shoe): shoe is NonNullable<typeof shoe> => Boolean(shoe))
    .map((shoe) => ({
      ...shoe,
      profile: buildRunnerProfile(shoe.reviews),
      specs: specificationsOf(shoe.specifications),
    }))

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-neutral-500">SHOE COMPARISON</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          条件まで見える、シューズ比較
        </h1>
        <p className="mt-3 text-neutral-600">
          最大3足を並べ、価格やスペックだけでなく、評価したランナーの走行距離・足型・用途も確認できます。
        </p>
      </div>

      <form className="mt-8 border border-neutral-200 bg-neutral-50 p-5" action="/compare" method="get">
        <div className="grid gap-4 md:grid-cols-3">
          {(['shoe1', 'shoe2', 'shoe3'] as const).map((name, index) => {
            const slot = index + 1
            return (
              <label key={name} className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  {slot}足目{slot === 3 ? '（任意）' : ''}
                </span>
                <select
                  name={name}
                  defaultValue={params[name] ?? ''}
                  className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                >
                  <option value="">選択してください</option>
                  {options.map((shoe) => (
                    <option key={shoe.id} value={shoe.id}>
                      {shoe.brand} {shoe.modelName}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="h-11 bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
            比較する
          </button>
          {selectedIds.length > 0 && (
            <Link href="/compare" className="text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline">
              選択をクリア
            </Link>
          )}
        </div>
      </form>

      {shoes.length < 2 ? (
        <div className="mt-8 border border-dashed border-neutral-300 px-6 py-12 text-center text-neutral-600">
          比較したいシューズを2足以上選んでください。
        </div>
      ) : (
        <section className="mt-8 overflow-x-auto border border-neutral-200" aria-label="シューズ比較結果">
          <div className="min-w-[760px]">
            <div
              className="grid border-b border-neutral-200 bg-white"
              style={{ gridTemplateColumns: `180px repeat(${shoes.length}, minmax(190px, 1fr))` }}
            >
              <div className="p-4 text-sm font-medium text-neutral-500">比較項目</div>
              {shoes.map((shoe) => (
                <div key={shoe.id} className="border-l border-neutral-200 p-4">
                  <div className="relative mb-3 aspect-[4/3] bg-neutral-50">
                    {shoe.imageUrls[0] ? (
                      <Image
                        src={shoe.imageUrls[0]}
                        alt={`${shoe.brand} ${shoe.modelName}`}
                        fill
                        className="object-contain p-3"
                        sizes="260px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-400">画像なし</div>
                    )}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{shoe.brand}</p>
                  <Link href={`/shoes/${shoe.id}`} className="mt-1 block font-semibold text-neutral-950 hover:underline">
                    {shoe.modelName}
                  </Link>
                </div>
              ))}
            </div>

            {([
              { label: 'カテゴリ', getValue: (shoe) => shoe.category },
              { label: '発売年', getValue: (shoe) => shoe.releaseYear ? `${shoe.releaseYear}年` : '—' },
              { label: '公式価格', getValue: (shoe) => shoe.officialPrice ? `¥${shoe.officialPrice.toLocaleString()}` : '—' },
              ...SPEC_ROWS.map(([key, label]) => ({
                label,
                getValue: (shoe: typeof shoes[number]) => displayValue(shoe.specs[key]),
              })),
              { label: '想定ランナー', getValue: (shoe) => displayValue(shoe.targetRunner) },
              { label: 'ユーザー評価', getValue: (shoe) => shoe.profile.averageRating == null ? '—' : `${shoe.profile.averageRating.toFixed(1)} / 10（${shoe.profile.ratingCount}件）` },
              { label: '週間走行距離', getValue: (shoe) => shoe.profile.averageWeeklyDistance == null ? 'データなし' : `平均 ${shoe.profile.averageWeeklyDistance} km` },
              { label: '足型', getValue: (shoe) => displayValue(shoe.profile.commonFootShapes) },
              { label: '主な用途', getValue: (shoe) => displayValue(shoe.profile.commonUsageScenes) },
            ] satisfies Array<{
              label: string
              getValue: (shoe: typeof shoes[number]) => string
            }>).map(({ label, getValue }, index) => (
              <div
                key={label}
                className={`grid ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}`}
                style={{ gridTemplateColumns: `180px repeat(${shoes.length}, minmax(190px, 1fr))` }}
              >
                <div className="border-b border-neutral-200 p-4 text-sm font-medium text-neutral-600">{label}</div>
                {shoes.map((shoe) => (
                  <div key={shoe.id} className="border-b border-l border-neutral-200 p-4 text-sm text-neutral-900">
                    {label === 'ユーザー評価' && shoe.profile.averageRating != null && (
                      <Star className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    )}
                    {getValue(shoe)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        ランナー条件はユーザー投稿レビューの入力値を集計しています。件数が少ない場合は参考値としてご覧ください。
      </p>
    </main>
  )
}
