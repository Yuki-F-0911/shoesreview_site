import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card>
        <CardContent className="py-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">404</h1>
          <p className="mb-8 text-lg text-gray-600">ページが見つかりませんでした</p>
          <Link href="/">
            <Button>ホームに戻る</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

