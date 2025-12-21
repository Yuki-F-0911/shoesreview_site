'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { reviewSchema, type ReviewInput } from '@/lib/validations/review'
import { createShoeSchema, type CreateShoeInput } from '@/lib/validations/shoe'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ReviewRating } from '@/components/reviews/ReviewRating'
import type { Shoe } from '@/types/shoe'
import { ReviewDetailedFields } from '@/components/reviews/ReviewDetailedFields'

interface ReviewFormProps {
  shoes: Shoe[]
  initialData?: Partial<ReviewInput>
  reviewId?: string
}

export function ReviewForm({ shoes, initialData, reviewId }: ReviewFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shoesList, setShoesList] = useState(shoes)
  const [isAddingShoe, setIsAddingShoe] = useState(false)
  // 入力モード: 'simple' = 簡易入力, 'detailed' = 詳細入力
  const [inputMode, setInputMode] = useState<'simple' | 'detailed'>('simple')
  const [newShoe, setNewShoe] = useState<CreateShoeInput>({
    brand: '',
    modelName: '',
    category: 'ランニング',
    imageUrls: [],
  })
  const [createShoeError, setCreateShoeError] = useState<string | null>(null)

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
      lightnessRating: initialData?.lightnessRating,
      stabilityRating: initialData?.stabilityRating,
      cushioningRating: initialData?.cushioningRating,
      gripRating: initialData?.gripRating,
      responsivenessRating: initialData?.responsivenessRating,
      title: initialData?.title || '',
      content: initialData?.content || '',
      imageUrls: initialData?.imageUrls || [],
      usagePeriod: initialData?.usagePeriod || '',
      usageScene: initialData?.usageScene || [],
      pros: initialData?.pros || [],
      cons: initialData?.cons || [],
      // isDraft removed
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

  const handleCreateShoe = async () => {
    setCreateShoeError(null)
    try {
      const validated = createShoeSchema.parse(newShoe)
      setIsLoading(true)

      const response = await fetch('/api/shoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      })

      const result = await response.json()

      if (!response.ok) {
        setCreateShoeError(result.error || 'シューズの作成に失敗しました')
        return
      }

      setShoesList((prev) => [...prev, result.data])
      setValue('shoeId', result.data.id)
      setIsAddingShoe(false)
      setNewShoe({ brand: '', modelName: '', category: 'ランニング', imageUrls: [] })
    } catch (err) {
      if (err instanceof z.ZodError) {
        setCreateShoeError(err.errors[0].message)
      } else {
        setCreateShoeError('予期しないエラーが発生しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

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
        const errorMessage = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'レビューの保存に失敗しました'
        setError(errorMessage)
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

          {/* 入力モード選択タブ */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="入力モード">
              <button
                type="button"
                onClick={() => setInputMode('simple')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${inputMode === 'simple'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📝 簡易入力
                <span className="ml-2 text-xs text-gray-400">（総合評価のみ）</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('detailed')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${inputMode === 'detailed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📊 詳細入力
                <span className="ml-2 text-xs text-gray-400">（全ての評価項目）</span>
              </button>
            </nav>
          </div>

          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
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
                  {shoesList.map((shoe) => (
                    <option key={shoe.id} value={shoe.id}>
                      {shoe.brand} {shoe.modelName}
                    </option>
                  ))}
                </select>
              </div>
              {!reviewId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingShoe(!isAddingShoe)}
                  disabled={isLoading}
                  className="mb-[1px]"
                >
                  {isAddingShoe ? 'キャンセル' : '新規追加'}
                </Button>
              )}
            </div>
            {errors.shoeId && (
              <p className="mt-1 text-sm text-red-600">{errors.shoeId.message}</p>
            )}

            {isAddingShoe && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-900">新しいシューズを追加</h4>
                {createShoeError && (
                  <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-800">
                    {createShoeError}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">ブランド</label>
                    <Input
                      value={newShoe.brand}
                      onChange={(e) => setNewShoe({ ...newShoe, brand: e.target.value })}
                      className="mt-1"
                      placeholder="例: Nike"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">モデル名</label>
                    <Input
                      value={newShoe.modelName}
                      onChange={(e) => setNewShoe({ ...newShoe, modelName: e.target.value })}
                      className="mt-1"
                      placeholder="例: Air Zoom Pegasus 40"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">カテゴリー</label>
                    <Input
                      value={newShoe.category}
                      onChange={(e) => setNewShoe({ ...newShoe, category: e.target.value })}
                      className="mt-1"
                      placeholder="例: ランニング"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateShoe}
                    disabled={isLoading}
                    size="sm"
                  >
                    保存して選択
                  </Button>
                </div>
              </div>
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

          {/* 簡易入力モード：使用シーンコメントのみ */}
          {inputMode === 'simple' && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <label htmlFor="quickComment" className="block text-sm font-medium text-gray-700">
                どんな時に使っていますか？
              </label>
              <Textarea
                id="quickComment"
                {...register('quickComment')}
                className="mt-2 bg-white"
                rows={3}
                placeholder="例: 週末のロングランで使用しています。フルマラソンのサブ4を目指して練習中です。"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                タイトルと本文は後から詳細入力モードで追加することもできます
              </p>
            </div>
          )}

          {/* 詳細入力モード：全ての評価項目 */}
          {inputMode === 'detailed' && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">履き心地</label>
                  <div className="mt-2">
                    <ReviewRating rating={comfortRating || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('comfortRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {comfortRating ? Math.round(comfortRating) : '0'}
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
                      step="1"
                      {...register('designRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {designRating ? Math.round(designRating) : '0'}
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
                      step="1"
                      {...register('durabilityRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {durabilityRating ? Math.round(durabilityRating) : '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">軽量性</label>
                  <div className="mt-2">
                    <ReviewRating rating={watch('lightnessRating') || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('lightnessRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {watch('lightnessRating') ? Math.round(watch('lightnessRating') || 0) : '0'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">安定性</label>
                  <div className="mt-2">
                    <ReviewRating rating={watch('stabilityRating') || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('stabilityRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {watch('stabilityRating') ? Math.round(watch('stabilityRating') || 0) : '0'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">クッション性</label>
                  <div className="mt-2">
                    <ReviewRating rating={watch('cushioningRating') || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('cushioningRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {watch('cushioningRating') ? Math.round(watch('cushioningRating') || 0) : '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">グリップ力</label>
                  <div className="mt-2">
                    <ReviewRating rating={watch('gripRating') || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('gripRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {watch('gripRating') ? Math.round(watch('gripRating') || 0) : '0'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">反発力</label>
                  <div className="mt-2">
                    <ReviewRating rating={watch('responsivenessRating') || 0} size="sm" />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      {...register('responsivenessRating', { valueAsNumber: true })}
                      className="mt-1 w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {watch('responsivenessRating') ? Math.round(watch('responsivenessRating') || 0) : '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  タイトル <span className="text-gray-400 font-normal">（任意）</span>
                </label>
                <Input id="title" {...register('title')} className="mt-1" disabled={isLoading} />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  レビュー本文 <span className="text-gray-400 font-normal">（任意）</span>
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


              <ReviewDetailedFields register={register} errors={errors} watch={watch} />
            </>
          )}

          <div className="flex items-center space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : reviewId ? '更新' : '投稿'}
            </Button>

          </div>
        </form>
      </CardContent>
    </Card>
  )
}

