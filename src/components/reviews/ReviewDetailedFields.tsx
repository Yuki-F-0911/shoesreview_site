
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { ReviewInput } from '@/lib/validations/review'
import { Input } from '@/components/ui/Input'


interface ReviewDetailedFieldsProps {
    register: UseFormRegister<ReviewInput>
    errors: FieldErrors<ReviewInput>
    watch: UseFormWatch<ReviewInput>
}

export function ReviewDetailedFields({ register, errors, watch }: ReviewDetailedFieldsProps) {
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

            {/* ステップイン評価 */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">ステップイン（足入れ感）</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {renderRangeInput('stepInToeWidth', 'つま先の広さ (1:狭い - 5:広い)')}
                    {renderRangeInput('stepInInstepHeight', '甲の高さ (1:低い - 5:高い)')}
                    {renderRangeInput('stepInHeelHold', 'ヒールのホールド (1:弱い - 5:強い)')}
                </div>
            </div>

            {/* 詳細特性（走行評価を統合） */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">詳細特性</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {renderRangeInput('runLightness', '軽さの実感 (1:重い - 5:軽い)')}
                    {renderRangeInput('runTransition', '走り出しの転がり (1:鈍い - 5:スムーズ)')}
                    {renderRangeInput('sdLanding', '着地感 (1:柔らかめ - 5:地面を感じる)')}
                    {renderRangeInput('sdResponse', '反発性 (1:ない - 5:ある)')}
                    {renderRangeInput('sdStability', '安定性 (1:自然 - 5:制御される)')}
                    {renderRangeInput('sdWidth', '足幅感 (1:タイト - 5:リラックス)')}
                    {renderRangeInput('sdDesign', 'デザイン (1:競技的 - 5:街履き)')}
                </div>
            </div>

            {/* 疲労感 (Select or Text?) CSV suggests 4 levels? "全く感じない" etc. */}
            {/* CSV had specific text values. Using Select for mapped standard values or Text? 
          The schema uses String, but Select is better for UX if values are fixed.
          I'll assume standard choices based on CSV: "全く感じない", "少し感じる", "かなり感じる", "非常に強く感じる"
      */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">走行後の疲労・違和感</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderSelectInput('fatigueSole', '足裏の疲労', ['全く感じない', '少し感じる', 'かなり感じる', '非常に強く感じる'])}
                    {renderSelectInput('fatigueCalf', 'ふくらはぎの張り', ['全く感じない', '少し感じる', 'かなり感じる', '非常に強く感じる'])}
                    {renderSelectInput('fatigueKnee', '膝への違和感', ['全く感じない', '少し感じる', 'かなり感じる', '非常に強く感じる'])}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">その他 (自由記述)</label>
                        <Input {...register('fatigueOther')} className="mt-1" />
                    </div>
                </div>
            </div>

            {/* その他 */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">その他</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">オノマトペ (感触)</label>
                        <Input {...register('onomatopoeia')} placeholder="例: フワフワ, カッチリ" className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">購入サイズ (cm)</label>
                        <Input {...register('purchaseSize')} placeholder="26.5" className="mt-1" />
                    </div>
                </div>
            </div>

            {/* レビュアー情報 */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">レビュアー情報 (任意)</h3>
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
                        '初心者（完走目標）',
                        'サブ6',
                        'サブ5',
                        'サブ4.5',
                        'サブ4',
                        'サブ3.5',
                        'サブ3',
                        'サブ2.5（エリート）',
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
