'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Shoe {
  id: string
  brand: string
  modelName: string
  category: string
  releaseYear: number | null
  officialPrice: number | null
  imageUrls: string[]
  description: string | null
  createdAt: string
  _count: {
    reviews: number
  }
}

export default function AdminShoesPage() {
  const [shoes, setShoes] = useState<Shoe[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    modelName: '',
    category: 'ランニング',
    releaseYear: '',
    officialPrice: '',
    description: '',
    keywords: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchShoes()
  }, [])

  const fetchShoes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shoes?limit=100')
      const data = await res.json()
      setShoes(data.data || [])
    } catch (error) {
      console.error('Failed to fetch shoes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/shoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null,
          officialPrice: formData.officialPrice ? parseInt(formData.officialPrice) : null,
          keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        setFormData({
          brand: '',
          modelName: '',
          category: 'ランニング',
          releaseYear: '',
          officialPrice: '',
          description: '',
          keywords: '',
        })
        setShowAddForm(false)
        fetchShoes()
      } else {
        const error = await res.json()
        alert(error.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('Failed to create shoe:', error)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？関連するレビューも削除されます。')) return

    try {
      const res = await fetch(`/api/shoes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchShoes()
      }
    } catch (error) {
      console.error('Failed to delete shoe:', error)
    }
  }

  const categories = [
    'ランニング',
    'レース',
    'トレーニング',
    'トレイル',
    'スタビリティ',
    'クッション',
    'スパイク',
  ]

  const brands = [
    'Nike',
    'Adidas',
    'ASICS',
    'New Balance',
    'Hoka',
    'On',
    'Saucony',
    'Brooks',
    'Mizuno',
    'Puma',
    'Reebok',
    'Under Armour',
    'その他',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              シューズ管理
            </h1>
            <p className="text-slate-600">
              シューズの追加・編集・削除を行います
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {showAddForm ? 'キャンセル' : '新規シューズを追加'}
          </button>
        </div>

        {/* 追加フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">新規シューズを追加</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ブランド *
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">選択してください</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  モデル名 *
                </label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: Pegasus 41"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  カテゴリ *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  発売年
                </label>
                <input
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 2024"
                  min="2000"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  定価（税込）
                </label>
                <input
                  type="number"
                  value={formData.officialPrice}
                  onChange={(e) => setFormData({ ...formData, officialPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 16500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  キーワード（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: マラソン, フルマラソン, サブ4"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                  placeholder="シューズの特徴や説明を入力"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '追加中...' : 'シューズを追加'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* シューズ一覧 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : shoes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-slate-500">シューズがありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">シューズ</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">カテゴリ</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">発売年</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">価格</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">レビュー数</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shoes.map((shoe) => (
                  <tr key={shoe.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {shoe.imageUrls && shoe.imageUrls[0] ? (
                            <Image
                              src={shoe.imageUrls[0]}
                              alt={`${shoe.brand} ${shoe.modelName}`}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              👟
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{shoe.brand}</p>
                          <p className="text-sm text-slate-500">{shoe.modelName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded">
                        {shoe.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {shoe.releaseYear || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {shoe.officialPrice ? `¥${shoe.officialPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {shoe._count?.reviews || 0}件
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/shoes/${shoe.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          表示
                        </Link>
                        <Link
                          href={`/admin/shoes/${shoe.id}/images`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          画像
                        </Link>
                        <button
                          onClick={() => handleDelete(shoe.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

