'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { reviewSchema, type ReviewInput } from '@/lib/validations/review'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ReviewRating } from '@/components/reviews/ReviewRating'
import type { Shoe } from '@/types/shoe'

interface ReviewFormProps {
  shoes: Shoe[]
  initialData?: Partial<ReviewInput>
  reviewId?: string
}

export function ReviewForm({ shoes, initialData, reviewId }: ReviewFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      overallRating: initialData?.overallRating || 5.0,
      comfortRating: initialData?.comfortRating,
      designRating: initialData?.designRating,
      durabilityRating: initialData?.durabilityRating,
      title: initialData?.title || '',
      content: initialData?.content || '',
      imageUrls: initialData?.imageUrls || [],
      usagePeriod: initialData?.usagePeriod || '',
      usageScene: initialData?.usageScene || [],
      pros: initialData?.pros || [],
      cons: initialData?.cons || [],
      isDraft: initialData?.isDraft || false,
    },
  })

  const {
    fields: prosFields,
    append: appendPros,
    remove: removePros,
  } = useFieldArray({
    control: control as unknown as Control<any>,
    name: 'pros',
  })

  const {
    fields: consFields,
    append: appendCons,
    remove: removeCons,
  } = useFieldArray({
    control: control as unknown as Control<any>,
    name: 'cons',
  })

  const overallRating = watch('overallRating')
  const comfortRating = watch('comfortRating')
  const designRating = watch('designRating')
  const durabilityRating = watch('durabilityRating')

  const onSubmit = async (data: ReviewInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = reviewId ? `/api/reviews/${reviewId}` : '/api/reviews'
      const method = reviewId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'レビューの保存に失敗しました')
        return
      }

      router.push(`/reviews/${result.data.id}`)
      router.refresh()
    } catch (err) {
      setError('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{reviewId ? 'レビューを編集' : 'レビューを投稿'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div>
            <label htmlFor="shoeId" className="block text-sm font-medium text-gray-700">
              シューズ *
            </label>
            <select
              id="shoeId"
              {...register('shoeId')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              disabled={isLoading || !!reviewId}
            >
              <option value="">選択してください</option>
              {shoes.map((shoe) => (
                <option key={shoe.id} value={shoe.id}>
                  {shoe.brand} {shoe.modelName}
                </option>
              ))}
            </select>
            {errors.shoeId && (
              <p className="mt-1 text-sm text-red-600">{errors.shoeId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">総合評価 *</label>
            <div className="mt-2 flex items-center space-x-4">
              <ReviewRating rating={overallRating} showNumber />
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                {...register('overallRating', { valueAsNumber: true })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {overallRating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">履き心地</label>
              <div className="mt-2">
                <ReviewRating rating={comfortRating || 0} size="sm" />
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  {...register('comfortRating', { valueAsNumber: true })}
                  className="mt-1 w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {comfortRating ? comfortRating.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">デザイン</label>
              <div className="mt-2">
                <ReviewRating rating={designRating || 0} size="sm" />
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  {...register('designRating', { valueAsNumber: true })}
                  className="mt-1 w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {designRating ? designRating.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">耐久性</label>
              <div className="mt-2">
                <ReviewRating rating={durabilityRating || 0} size="sm" />
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  {...register('durabilityRating', { valueAsNumber: true })}
                  className="mt-1 w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {durabilityRating ? durabilityRating.toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タイトル *
            </label>
            <Input id="title" {...register('title')} className="mt-1" disabled={isLoading} />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              レビュー本文 *
            </label>
            <Textarea
              id="content"
              {...register('content')}
              className="mt-1"
              rows={8}
              disabled={isLoading}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="usagePeriod" className="block text-sm font-medium text-gray-700">
              使用期間
            </label>
            <Input
              id="usagePeriod"
              {...register('usagePeriod')}
              className="mt-1"
              placeholder="例: 6ヶ月"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">長所</label>
            <div className="mt-2 space-y-2">
              {prosFields.map((field, index) => (
                <div key={field.id} className="flex space-x-2">
                  <Input
                    {...register(`pros.${index}`)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePros(index)}
                    disabled={isLoading}
                  >
                    削除
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPros('')}
                disabled={isLoading}
              >
                追加
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">短所</label>
            <div className="mt-2 space-y-2">
              {consFields.map((field, index) => (
                <div key={field.id} className="flex space-x-2">
                  <Input
                    {...register(`cons.${index}`)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCons(index)}
                    disabled={isLoading}
                  >
                    削除
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCons('')}
                disabled={isLoading}
              >
                追加
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : reviewId ? '更新' : '投稿'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue('isDraft', true)
                handleSubmit(onSubmit)()
              }}
              disabled={isLoading}
            >
              下書き保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

