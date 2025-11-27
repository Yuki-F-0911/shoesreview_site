import { Card, CardContent } from '@/components/ui/Card'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  )
}

