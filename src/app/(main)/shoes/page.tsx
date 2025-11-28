import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'
import { ShoeCard } from '@/components/shoes/ShoeCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data'
import { shoesListMetadata } from '@/lib/seo/metadata'

// 動的レンダリングを強制（ビルド時の静的生成をスキップ）
export const dynamic = 'force-dynamic'

export const metadata: Metadata = shoesListMetadata

async function getShoes() {
  try {
    return await prisma.shoe.findMany({
      orderBy: [
        { brand: 'asc' },
        { modelName: 'asc' },
      ],
      include: {
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch shoes:', error)
    // エラーが発生した場合は空配列を返す
    return []
  }
}

export default async function ShoesPage() {
  const shoes = await getShoes()

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'ホーム', url: '/' },
    { name: 'シューズ一覧', url: '/shoes' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      
      <div className="container mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">ホーム</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">シューズ一覧</li>
          </ol>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">シューズ一覧</h1>
            <p className="mt-1 text-gray-600">全{shoes.length}モデルのランニングシューズを掲載</p>
          </div>
        </div>

      {shoes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shoes.map((shoe) => (
            <ShoeCard key={shoe.id} shoe={shoe} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="シューズが登録されていません"
          description="最初のシューズを登録してみましょう"
        />
      )}
      </div>
    </>
  )
}

