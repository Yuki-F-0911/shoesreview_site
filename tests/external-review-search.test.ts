import assert from 'node:assert/strict'
import test from 'node:test'

import { searchExternalReviewResults } from '../src/lib/external-reviews/search'

test('searchExternalReviewResults adapts the shared web search result shape', async () => {
  const search = async () => ({
    items: [
      {
        title: 'Test review',
        url: 'https://example.com/review',
        snippet: 'A useful review',
        displayUrl: 'example.com',
      },
    ],
    totalResults: 1,
  })

  const results = await searchExternalReviewResults('test query', 5, search)

  assert.deepEqual(results, [
    {
      title: 'Test review',
      link: 'https://example.com/review',
      snippet: 'A useful review',
    },
  ])
})
