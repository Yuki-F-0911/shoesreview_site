'use client'

import { useState } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { ReviewInput } from '@/lib/validations/review'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { User } from 'lucide-react'


interface ReviewDetailedFieldsProps {
    register: UseFormRegister<ReviewInput>
    errors: FieldErrors<ReviewInput>
    watch: UseFormWatch<ReviewInput>
    setValue?: UseFormSetValue<ReviewInput>
}

export function ReviewDetailedFields({ register, errors, watch, setValue }: ReviewDetailedFieldsProps) {
    const [isLoadingProfile, setIsLoadingProfile] = useState(false)
    const [profileMessage, setProfileMessage] = useState<string | null>(null)

    // プロフィールから情報を自動入力
    const handleLoadProfile = async () => {
        if (!setValue) return

        setIsLoadingProfile(true)
        setProfileMessage(null)

        try {
            const response = await fetch('/api/users/profile')
            if (!response.ok) {
                setProfileMessage(response.status === 401 ? 'ログインが必要です' : 'プロフィールの読み込みに失敗しました')
                return
            }

            const result = await response.json()
            const profile = result.data

            // プロフィールの各フィールドをフォームに設定
            if (profile.runnerAge) setValue('reviewerAge', profile.runnerAge)
            if (profile.runnerGender) setValue('reviewerGender', profile.runnerGender)
            if (profile.runnerHeight) {
                // 身長を範囲に変換
                const height = profile.runnerHeight
                let range = '回答しない'
                if (height < 150) range = '150cm未満'
                else if (height < 160) range = '150-159cm'
                else if (height < 170) range = '160-169cm'
                else if (height < 180) range = '170-179cm'
                else if (height < 190) range = '180-189cm'
                else range = '190cm以上'
                setValue('reviewerHeightRange', range)
            }
            if (profile.runnerWeight) {
                // 体重を範囲に変換
                const weight = profile.runnerWeight
                let range = '回答しない'
                if (weight < 40) range = '40kg未満'
                else if (weight < 50) range = '40-49kg'
                else if (weight < 60) range = '50-59kg'
                else if (weight < 70) range = '60-69kg'
                else if (weight < 80) range = '70-79kg'
                else if (weight < 90) range = '80-89kg'
                else range = '90kg以上'
                setValue('reviewerWeightRange', range)
            }
            if (profile.runnerWeeklyDistance) setValue('reviewerWeeklyDistance', profile.runnerWeeklyDistance)
            if (profile.runnerPersonalBest) {
                // プロフィールの値（短縮形）をフォームの選択肢（詳細形）にマッピング
                const pbMapping: Record<string, string> = {
                    '入門': '入門（走り始めたばかり）',
                    '初級': '初級（ゆっくりペースで楽しむ）',
                    '中級': '中級（継続的にトレーニング）',
                    '中上級': '中上級（記録向上を目指す）',
                    '上級': '上級（競技志向）',
                    'エリート': 'エリート（トップレベル）'
                }
                const mappedValue = pbMapping[profile.runnerPersonalBest] || profile.runnerPersonalBest
                setValue('reviewerPersonalBestLevel', mappedValue)
            }
            if (profile.runnerLandingType) setValue('reviewerLandingType', profile.runnerLandingType)
            if (profile.runnerExpertise?.length > 0) setValue('reviewerExpertise', profile.runnerExpertise)
            if (profile.runnerFootShape?.length > 0) setValue('reviewerFootShape', profile.runnerFootShape)

            setProfileMessage('プロフィールから入力しました')
        } catch (error) {
            setProfileMessage('エラーが発生しました')
        } finally {
            setIsLoadingProfile(false)
        }
    }

    const renderRangeInput = (name: keyof ReviewInput, label: string, min = 1, max = 5) => {
        const value = watch(name) as number | undefined
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="mt-2 flex items-center space-x-4">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step="1"
                        {...register(name, { valueAsNumber: true })}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-8 text-right">
                        {value || '-'}
                    </span>
                </div>
            </div>
        )
    }

    const renderSelectInput = (name: keyof ReviewInput, label: string, options: string[]) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <select
                {...register(name)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="">選択してください</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    )

    return (
        <div className="space-y-8 border-t border-gray-200 pt-6 mt-6">

            {/* レビュアー情報 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">レビュアー情報 (任意)</h3>
                    {setValue && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleLoadProfile}
                            disabled={isLoadingProfile}
                        >
                            <User className="h-4 w-4 mr-1" />
                            {isLoadingProfile ? '読み込み中...' : 'プロフィールから入力'}
                        </Button>
                    )}
                </div>
                {profileMessage && (
                    <div className={`text-sm mb-4 ${profileMessage.includes('失敗') || profileMessage.includes('エラー') || profileMessage.includes('必要') ? 'text-red-600' : 'text-green-600'}`}>
                        {profileMessage}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">年齢</label>
                        <Input {...register('reviewerAge', { valueAsNumber: true })} type="number" min="10" max="100" className="mt-1" placeholder="30" />
                    </div>
                    {renderSelectInput('reviewerGender', '性別', ['男性', '女性', '回答しない'])}
                    {renderSelectInput('reviewerHeightRange', '身長', [
                        '150cm未満',
                        '150-159cm',
                        '160-169cm',
                        '170-179cm',
                        '180-189cm',
                        '190cm以上',
                        '回答しない'
                    ])}
                    {renderSelectInput('reviewerWeightRange', '体重', [
                        '40kg未満',
                        '40-49kg',
                        '50-59kg',
                        '60-69kg',
                        '70-79kg',
                        '80-89kg',
                        '90kg以上',
                        '回答しない'
                    ])}
                </div>
                <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">週間走行距離 (km)</label>
                        <Input {...register('reviewerWeeklyDistance', { valueAsNumber: true })} type="number" className="mt-1" />
                    </div>
                    {renderSelectInput('reviewerPersonalBestLevel', '走力レベル', [
                        '入門（走り始めたばかり）',
                        '初級（ゆっくりペースで楽しむ）',
                        '中級（継続的にトレーニング）',
                        '中上級（記録向上を目指す）',
                        '上級（競技志向）',
                        'エリート（トップレベル）',
                        '回答しない'
                    ])}
                    {renderSelectInput('reviewerLandingType', '接地タイプ', ['ヒールストライク', 'ミッドフット', 'フォアフット', '不明'])}
                </div>

                {/* 専門種目（複数選択） */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">専門種目（該当するもの全て選択）</label>
                    <div className="flex flex-wrap gap-3">
                        {['短距離', '中距離', '長距離', 'ロードレース', 'トレイルランニング', 'その他'].map((expertise) => (
                            <label key={expertise} className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={expertise}
                                    {...register('reviewerExpertise')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{expertise}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 足の形状（複数選択） */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">足の形状（該当するもの全て選択）</label>
                    <p className="text-xs text-gray-500 mb-3">
                        <span className="font-medium">エジプト型：</span>親指が一番長い
                        <span className="font-medium">ギリシャ型：</span>人差し指が一番長い
                        <span className="font-medium">スクエア型：</span>指の長さがほぼ揃っている
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {['幅広', '甲高', 'エジプト型', 'ギリシャ型', 'スクエア型', '特になし', 'その他'].map((shape) => (
                            <label key={shape} className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    value={shape}
                                    {...register('reviewerFootShape')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{shape}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">足の形状に関する詳細な補足</label>
                        <Input {...register('reviewerFootShapeDetail')} className="mt-1" placeholder="その他の詳細があれば" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">接地タイプの補足があれば</label>
                        <Input {...register('reviewerLandingTypeDetail')} className="mt-1" />
                    </div>
                </div>
            </div>

        </div>
    )
}
