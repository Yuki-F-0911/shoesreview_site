import { CuratedSourceCard } from './CuratedSourceCard'
import type { CuratedSource } from '@/types/curation'

interface CuratedSourceSectionProps {
  title: string
  sources: CuratedSource[]
  description?: string
}

export function CuratedSourceSection({ title, sources, description }: CuratedSourceSectionProps) {
  if (!sources.length) {
    return null
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <CuratedSourceCard key={source.id} source={source} />
        ))}
      </div>
    </section>
  )
}


