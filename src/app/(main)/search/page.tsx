import { Suspense } from 'react'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; brand?: string; category?: string }
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">検索</h1>
      <div className="mb-8">
        <SearchBar />
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

