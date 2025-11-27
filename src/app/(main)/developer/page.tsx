import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function DeveloperPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">開発者向け情報</h1>
        <p className="mt-2 text-lg text-gray-600">
          シューズレビューサイトの技術的な詳細について
        </p>
      </div>

      <div className="space-y-8">
        {/* 技術スタック */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">技術スタック</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium text-gray-800">フロントエンド</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Next.js 14.2.0</Badge>
                <Badge variant="outline">React 18.3.0</Badge>
                <Badge variant="outline">TypeScript 5.3.3</Badge>
                <Badge variant="outline">Tailwind CSS 3.4.0</Badge>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-gray-800">バックエンド</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Next.js API Routes</Badge>
                <Badge variant="outline">Prisma 5.11.0</Badge>
                <Badge variant="outline">PostgreSQL 18.1.1</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* データモデル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">データモデル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium text-gray-800">Review（レビュー）</h3>
              <p className="text-sm text-gray-600">
                ユーザーが投稿したレビューが保存されます。
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-gray-800">Shoe（シューズ）</h3>
              <p className="text-sm text-gray-600">
                レビュー対象となるシューズの情報が保存されます。
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

