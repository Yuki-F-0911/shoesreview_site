import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'

export interface ErrorMessageProps {
  title?: string
  message: string
  className?: string
}

export function ErrorMessage({ title = 'エラーが発生しました', message, className }: ErrorMessageProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardHeader>
        <CardTitle className="text-red-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-700">{message}</p>
      </CardContent>
    </Card>
  )
}

