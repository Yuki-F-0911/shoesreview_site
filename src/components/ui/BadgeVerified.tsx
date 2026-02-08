'use client'

import { CheckCircle } from 'lucide-react'
import type { ExpertiseLevel } from '@/types/user'

interface BadgeVerifiedProps {
    isVerified: boolean
    expertiseLevel?: ExpertiseLevel | string | null
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
}

const levelConfig: Record<
    string,
    { color: string; bgColor: string; label: string }
> = {
    BEGINNER: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'ビギナー',
    },
    INTERMEDIATE: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: '中級者',
    },
    ADVANCED: {
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: '上級者',
    },
    EXPERT: {
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        label: 'エキスパート',
    },
}

const sizeConfig = {
    sm: { icon: 14, text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { icon: 16, text: 'text-sm', padding: 'px-2 py-1' },
    lg: { icon: 20, text: 'text-base', padding: 'px-3 py-1.5' },
}

export function BadgeVerified({
    isVerified,
    expertiseLevel,
    size = 'md',
    showLabel = false,
}: BadgeVerifiedProps) {
    if (!isVerified) return null

    const level = expertiseLevel ? levelConfig[expertiseLevel] : null
    const sizeStyle = sizeConfig[size]

    // レベルが指定されている場合はバッジ形式で表示
    if (level && showLabel) {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full ${level.bgColor} ${level.color} ${sizeStyle.padding} ${sizeStyle.text} font-medium`}
            >
                <CheckCircle size={sizeStyle.icon} className="flex-shrink-0" />
                <span>{level.label}</span>
            </span>
        )
    }

    // アイコンのみ表示
    const iconColor = level ? level.color : 'text-blue-500'
    return (
        <CheckCircle
            size={sizeStyle.icon}
            className={`${iconColor} flex-shrink-0`}
            aria-label="認証済みユーザー"
        />
    )
}
