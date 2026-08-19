import { formatDate } from './date'

interface ReviewDateSource {
  postedAt: Date | string | null | undefined
}

export function getReviewDisplayDate(review: ReviewDateSource): string {
  return formatDate(review.postedAt)
}

export function formatRating(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const rating = Number(value)
  if (!Number.isFinite(rating)) {
    return null
  }

  return rating.toFixed(1)
}
