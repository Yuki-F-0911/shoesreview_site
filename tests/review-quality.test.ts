import assert from 'node:assert/strict'
import test from 'node:test'

import { LATEST_REVIEW_ORDER } from '../src/lib/reviews/query'
import { generateReviewSchema } from '../src/lib/seo/structured-data'
import { isValidBrandName } from '../src/lib/shoes/brand'
import { formatDate } from '../src/lib/utils/date'
import { formatRating, getReviewDisplayDate } from '../src/lib/utils/review'

test('formatDate formats a valid review date in Japanese', () => {
  assert.equal(formatDate('2026-02-12T04:11:33.687Z'), '2026年2月12日')
})

test('formatDate does not replace a missing date with today', () => {
  assert.equal(formatDate(undefined), '')
  assert.equal(formatDate('not-a-date'), '')
})

test('getReviewDisplayDate uses postedAt', () => {
  assert.equal(
    getReviewDisplayDate({ postedAt: '2026-02-12T04:11:33.687Z' }),
    '2026年2月12日'
  )
})

test('formatRating rejects missing and invalid ratings', () => {
  assert.equal(formatRating(null), null)
  assert.equal(formatRating(undefined), null)
  assert.equal(formatRating('not-a-number'), null)
})

test('formatRating formats a numeric rating to one decimal place', () => {
  assert.equal(formatRating('6.8'), '6.8')
  assert.equal(formatRating(8), '8.0')
})

test('isValidBrandName accepts real brands and rejects corrupted values', () => {
  assert.equal(isValidBrandName('New Balance'), true)
  assert.equal(isValidBrandName('ASICS'), true)
  assert.equal(isValidBrandName('Unknown'), false)
  assert.equal(isValidBrandName('1500m),172.5,61.3,60km,800m'), false)
})

test('latest reviews are ordered by postedAt descending', () => {
  assert.deepEqual(LATEST_REVIEW_ORDER, { postedAt: 'desc' })
})

test('review schema uses postedAt and omits a missing rating', () => {
  const schema = generateReviewSchema({
    id: 'review-1',
    postedAt: new Date('2026-02-12T04:11:33.687Z'),
    overallRating: null,
    title: 'AI review',
    content: 'Summary',
    type: 'AI_SUMMARY',
    imageUrls: [],
    pros: [],
    cons: [],
  } as never)

  assert.equal(schema.datePublished, '2026-02-12T04:11:33.687Z')
  assert.equal('reviewRating' in schema, false)
})
