import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRunnerProfile,
  getComparisonIds,
} from '../src/lib/shoes/comparison'

test('getComparisonIds keeps unique valid selections in slot order', () => {
  assert.deepEqual(
    getComparisonIds({ shoe1: 'shoe-b', shoe2: 'shoe-a', shoe3: 'shoe-b' }),
    ['shoe-b', 'shoe-a']
  )
})

test('getComparisonIds ignores empty values and limits the result to three shoes', () => {
  assert.deepEqual(
    getComparisonIds({ shoe1: ' ', shoe2: 'shoe-a', shoe3: 'shoe-c' }),
    ['shoe-a', 'shoe-c']
  )
})

test('buildRunnerProfile summarizes only user reviews with condition data', () => {
  const profile = buildRunnerProfile([
    {
      type: 'USER',
      overallRating: '8.0',
      reviewerWeeklyDistance: 40,
      reviewerFootShape: ['幅広'],
      usageScene: ['ジョグ'],
    },
    {
      type: 'USER',
      overallRating: 6,
      reviewerWeeklyDistance: 20,
      reviewerFootShape: ['幅広', '甲高'],
      usageScene: ['ジョグ', 'ロング走'],
    },
    {
      type: 'AI_SUMMARY',
      overallRating: null,
      reviewerWeeklyDistance: 100,
      reviewerFootShape: ['標準'],
      usageScene: ['レース'],
    },
  ])

  assert.deepEqual(profile, {
    averageRating: 7,
    ratingCount: 2,
    averageWeeklyDistance: 30,
    commonFootShapes: ['幅広', '甲高'],
    commonUsageScenes: ['ジョグ', 'ロング走'],
  })
})
