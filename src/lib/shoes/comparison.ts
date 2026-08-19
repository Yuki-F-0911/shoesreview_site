type ComparisonSearchParams = {
  shoe1?: string
  shoe2?: string
  shoe3?: string
}

type ReviewCondition = {
  type: string
  overallRating: unknown
  reviewerWeeklyDistance: number | null
  reviewerFootShape: string[]
  usageScene: string[]
}

export type RunnerProfile = {
  averageRating: number | null
  ratingCount: number
  averageWeeklyDistance: number | null
  commonFootShapes: string[]
  commonUsageScenes: string[]
}

export function getComparisonIds(params: ComparisonSearchParams): string[] {
  const seen = new Set<string>()

  return [params.shoe1, params.shoe2, params.shoe3]
    .map((value) => value?.trim() ?? '')
    .filter((value) => {
      if (!value || seen.has(value)) return false
      seen.add(value)
      return true
    })
    .slice(0, 3)
}

function mostCommon(values: string[][], limit = 2): string[] {
  const counts = new Map<string, { count: number; order: number }>()
  let order = 0

  values.flat().forEach((value) => {
    if (!value) return
    const current = counts.get(value)
    counts.set(value, {
      count: (current?.count ?? 0) + 1,
      order: current?.order ?? order++,
    })
  })

  return [...counts.entries()]
    .sort(([, a], [, b]) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(([value]) => value)
}

export function buildRunnerProfile(reviews: ReviewCondition[]): RunnerProfile {
  const userReviews = reviews.filter((review) => review.type === 'USER')
  const ratings = userReviews
    .map((review) => Number(review.overallRating))
    .filter(Number.isFinite)
  const weeklyDistances = userReviews
    .map((review) => review.reviewerWeeklyDistance)
    .filter((value): value is number => value !== null && Number.isFinite(value))

  return {
    averageRating: ratings.length
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null,
    ratingCount: ratings.length,
    averageWeeklyDistance: weeklyDistances.length
      ? Math.round(weeklyDistances.reduce((sum, distance) => sum + distance, 0) / weeklyDistances.length)
      : null,
    commonFootShapes: mostCommon(userReviews.map((review) => review.reviewerFootShape)),
    commonUsageScenes: mostCommon(userReviews.map((review) => review.usageScene)),
  }
}
