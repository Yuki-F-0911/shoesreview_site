import Image from 'next/image'
import Link from 'next/link'
import { CuratedSourceType } from '@prisma/client'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { CuratedSource } from '@/types/curation'
import { formatDate } from '@/lib/utils/date'

const typeLabel: Record<CuratedSourceType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  [CuratedSourceType.OFFICIAL]: { label: '公式', variant: 'default' },
  [CuratedSourceType.MARKETPLACE]: { label: 'ショップ', variant: 'secondary' },
  [CuratedSourceType.SNS]: { label: 'SNS', variant: 'secondary' },
  [CuratedSourceType.VIDEO]: { label: '動画', variant: 'default' },
  [CuratedSourceType.ARTICLE]: { label: '記事', variant: 'outline' },
  [CuratedSourceType.COMMUNITY]: { label: 'コミュニティ', variant: 'outline' },
}

interface CuratedSourceCardProps {
  source: CuratedSource
}

export function CuratedSourceCard({ source }: CuratedSourceCardProps) {
  const badge = typeLabel[source.type]

  return (
    <Link href={source.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Badge variant={badge?.variant || 'outline'}>{badge?.label || '情報源'}</Badge>
            <span className="text-xs text-gray-500">{source.platform}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{source.title}</h3>
          {source.thumbnailUrl && (
            <div className="relative aspect-video overflow-hidden rounded-md bg-gray-100">
              <Image src={source.thumbnailUrl} alt={source.title} fill className="object-cover" sizes="320px" />
            </div>
          )}
          {source.excerpt && <p className="text-sm text-gray-600 line-clamp-3">{source.excerpt}</p>}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{source.author || '自動取得'}</span>
            {source.publishedAt && <span>{formatDate(source.publishedAt)}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}


