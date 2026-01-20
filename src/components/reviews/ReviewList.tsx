'use client'

import { useState } from 'react'
import { ReviewCard } from '@/components/reviews/ReviewCard'

interface ReviewListProps {
    reviews: any[]
}

export function ReviewList({ reviews }: ReviewListProps) {
    const [filter, setFilter] = useState<'ALL' | 'USER' | 'AI'>('ALL')

    const filteredReviews = reviews.filter(review => {
        if (filter === 'ALL') return true
        if (filter === 'USER') return review.type === 'USER' || review.userId !== null
        if (filter === 'AI') return review.type === 'AI_SUMMARY'
        return true
    })

    // Count for tabs
    const userCount = reviews.filter(r => r.type === 'USER' || r.userId !== null).length
    const aiCount = reviews.filter(r => r.type === 'AI_SUMMARY').length

    return (
        <div>
            {/* Filter Tabs */}
            <div className="flex space-x-6 mb-6 border-b border-gray-200">
                <button
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'ALL'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    onClick={() => setFilter('ALL')}
                >
                    すべて <span className="ml-1 text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">{reviews.length}</span>
                </button>
                <button
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'USER'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    onClick={() => setFilter('USER')}
                >
                    ユーザーレビュー <span className="ml-1 text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">{userCount}</span>
                </button>
                <button
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === 'AI'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    onClick={() => setFilter('AI')}
                >
                    AI要約 <span className="ml-1 text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">{aiCount}</span>
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                        <p>この条件に一致するレビューはありません</p>
                    </div>
                )}
            </div>
        </div>
    )
}
