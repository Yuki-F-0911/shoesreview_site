'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const EXPERTISE_OPTIONS = ['短距離', '中距離', '長距離', 'ロードレース', 'トレイルランニング', 'その他']
const FOOT_SHAPE_OPTIONS = ['幅広', '甲高', 'エジプト型', 'ギリシャ型', 'スクエア型', '特になし', 'その他']

interface ProfileData {
    runnerAge: number | null
    runnerGender: string | null
    runnerGenderPublic: boolean
    runnerHeight: number | null
    runnerWeight: number | null
    runnerWeeklyDistance: number | null
    runnerPersonalBest: string | null
    runnerExpertise: string[]
    runnerFootShape: string[]
    runnerLandingType: string | null
}

export function ProfileForm() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [profile, setProfile] = useState<ProfileData>({
        runnerAge: null,
        runnerGender: null,
        runnerGenderPublic: true,
        runnerHeight: null,
        runnerWeight: null,
        runnerWeeklyDistance: null,
        runnerPersonalBest: null,
        runnerExpertise: [],
        runnerFootShape: [],
        runnerLandingType: null,
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }

        if (status === 'authenticated') {
            fetchProfile()
        }
    }, [status, router])

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/users/profile')
            if (response.ok) {
                const result = await response.json()
                setProfile(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setIsFetching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            })

            if (response.ok) {
                setMessage({ type: 'success', text: 'プロフィールを更新しました' })
            } else {
                const result = await response.json()
                setMessage({ type: 'error', text: result.error || '更新に失敗しました' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleExpertiseChange = (expertise: string) => {
        setProfile(prev => ({
            ...prev,
            runnerExpertise: prev.runnerExpertise.includes(expertise)
                ? prev.runnerExpertise.filter(e => e !== expertise)
                : [...prev.runnerExpertise, expertise]
        }))
    }

    const handleFootShapeChange = (shape: string) => {
        setProfile(prev => ({
            ...prev,
            runnerFootShape: prev.runnerFootShape.includes(shape)
                ? prev.runnerFootShape.filter(s => s !== shape)
                : [...prev.runnerFootShape, shape]
        }))
    }

    if (status === 'loading' || isFetching) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-neutral-500">読み込み中...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ランナープロフィール</CardTitle>
                <p className="text-sm text-neutral-500">
                    レビュー投稿時に自動入力できます
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* 基本情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">年齢</label>
                            <Input
                                type="number"
                                min="10"
                                max="100"
                                value={profile.runnerAge || ''}
                                onChange={e => setProfile({ ...profile, runnerAge: e.target.value ? parseInt(e.target.value) : null })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">性別</label>
                            <select
                                value={profile.runnerGender || ''}
                                onChange={e => setProfile({ ...profile, runnerGender: e.target.value || null })}
                                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="">選択してください</option>
                                <option value="男性">男性</option>
                                <option value="女性">女性</option>
                                <option value="回答しない">回答しない</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">身長 (cm)</label>
                            <Input
                                type="number"
                                min="100"
                                max="250"
                                value={profile.runnerHeight || ''}
                                onChange={e => setProfile({ ...profile, runnerHeight: e.target.value ? parseFloat(e.target.value) : null })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">体重 (kg)</label>
                            <Input
                                type="number"
                                min="20"
                                max="200"
                                value={profile.runnerWeight || ''}
                                onChange={e => setProfile({ ...profile, runnerWeight: e.target.value ? parseFloat(e.target.value) : null })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* ランニング情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">週間走行距離 (km)</label>
                            <Input
                                type="number"
                                min="0"
                                value={profile.runnerWeeklyDistance || ''}
                                onChange={e => setProfile({ ...profile, runnerWeeklyDistance: e.target.value ? parseFloat(e.target.value) : null })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">走力レベル</label>
                            <select
                                value={profile.runnerPersonalBest || ''}
                                onChange={e => setProfile({ ...profile, runnerPersonalBest: e.target.value || null })}
                                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="">選択してください</option>
                                <option value="入門">入門（走り始めたばかり）</option>
                                <option value="初級">初級（ゆっくりペースで楽しむ）</option>
                                <option value="中級">中級（継続的にトレーニング）</option>
                                <option value="中上級">中上級（記録向上を目指す）</option>
                                <option value="上級">上級（競技志向）</option>
                                <option value="エリート">エリート（トップレベル）</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">接地タイプ</label>
                            <select
                                value={profile.runnerLandingType || ''}
                                onChange={e => setProfile({ ...profile, runnerLandingType: e.target.value || null })}
                                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="">選択してください</option>
                                <option value="ヒールストライク">ヒールストライク</option>
                                <option value="ミッドフット">ミッドフット</option>
                                <option value="フォアフット">フォアフット</option>
                                <option value="不明">不明</option>
                            </select>
                        </div>
                    </div>

                    {/* 専門種目 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">専門種目</label>
                        <div className="flex flex-wrap gap-3">
                            {EXPERTISE_OPTIONS.map(expertise => (
                                <label key={expertise} className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={profile.runnerExpertise.includes(expertise)}
                                        onChange={() => handleExpertiseChange(expertise)}
                                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-neutral-700">{expertise}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 足の形状 */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">足の形状</label>
                        <p className="text-xs text-neutral-500 mb-3">
                            <span className="font-medium">エジプト型：</span>親指が一番長い
                            <span className="font-medium">ギリシャ型：</span>人差し指が一番長い
                            <span className="font-medium">スクエア型：</span>指の長さがほぼ揃っている
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {FOOT_SHAPE_OPTIONS.map(shape => (
                                <label key={shape} className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={profile.runnerFootShape.includes(shape)}
                                        onChange={() => handleFootShapeChange(shape)}
                                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-neutral-700">{shape}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 性別公開設定 */}
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={profile.runnerGenderPublic}
                                onChange={e => setProfile({ ...profile, runnerGenderPublic: e.target.checked })}
                                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-neutral-700">性別を公開する</span>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? '保存中...' : '保存する'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
