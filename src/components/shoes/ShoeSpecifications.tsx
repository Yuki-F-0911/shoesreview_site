import { Weight, Ruler, Layers, Footprints, ChevronDown, ChevronUp, Zap, Shield } from 'lucide-react'

interface ShoeSpecificationsProps {
  specifications: Record<string, unknown>
  targetRunner?: string[]
}

const SPEC_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  weight: { label: '重量', icon: <Weight className="w-4 h-4" /> },
  drop: { label: 'ドロップ', icon: <ChevronDown className="w-4 h-4" /> },
  stackHeight: { label: 'スタックハイト', icon: <Layers className="w-4 h-4" /> },
  midsoleTech: { label: 'ミッドソール', icon: <Zap className="w-4 h-4" /> },
  outsole: { label: 'アウトソール', icon: <Footprints className="w-4 h-4" /> },
  plateTech: { label: 'プレート', icon: <Shield className="w-4 h-4" /> },
  upperMaterial: { label: 'アッパー素材', icon: <Ruler className="w-4 h-4" /> },
  widthOptions: { label: 'ワイズ', icon: <ChevronUp className="w-4 h-4" /> },
  useCase: { label: '用途', icon: <Footprints className="w-4 h-4" /> },
}

export function ShoeSpecifications({ specifications, targetRunner }: ShoeSpecificationsProps) {
  const entries = Object.entries(specifications).filter(
    ([, value]) => value != null && value !== '' && !(Array.isArray(value) && value.length === 0)
  )

  if (entries.length === 0 && (!targetRunner || targetRunner.length === 0)) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4">スペック</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries.map(([key, value]) => {
          const config = SPEC_CONFIG[key]
          const label = config?.label || key
          const icon = config?.icon || <Ruler className="w-4 h-4" />
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value)

          return (
            <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800 break-words">{displayValue}</p>
              </div>
            </div>
          )
        })}
      </div>

      {targetRunner && targetRunner.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">ターゲットランナー</p>
          <div className="flex flex-wrap gap-2">
            {targetRunner.map((runner) => (
              <span
                key={runner}
                className="inline-block px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full"
              >
                {runner}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
