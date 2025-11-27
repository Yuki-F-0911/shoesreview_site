'use client'

import { useEffect } from 'react'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorMessage
        title="エラーが発生しました"
        message={error.message || '予期しないエラーが発生しました'}
      />
      <div className="mt-4 text-center">
        <Button onClick={() => reset()}>もう一度試す</Button>
      </div>
    </div>
  )
}

