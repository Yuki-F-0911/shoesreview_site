/**
 * AI機能用の型定義
 */

// AIレビューアシスト入力
export interface ReviewAssistInput {
    type: 'draft' | 'pros_cons' | 'title'
    input: string
    shoeBrand?: string
    shoeModel?: string
}

// AIレビューアシスト出力
export interface ReviewAssistOutput {
    draft?: string
    pros?: string[]
    cons?: string[]
    titles?: string[]
}

// AI下書き生成リクエスト
export interface DraftGenerationRequest {
    keywords: string[]
    shoeBrand?: string
    shoeModel?: string
    tone?: 'casual' | 'formal' | 'enthusiast'
}

// AI長所短所抽出リクエスト
export interface ProsConsExtractionRequest {
    content: string
    shoeBrand?: string
    shoeModel?: string
}

// AIタイトル提案リクエスト
export interface TitleSuggestionRequest {
    content: string
    shoeBrand?: string
    shoeModel?: string
}

// AIアシストモードの状態
export type AIAssistMode = 'idle' | 'generating' | 'success' | 'error'

// AIアシストの設定
export interface AIAssistSettings {
    enabled: boolean
    autoSuggestProsCons: boolean
    autoSuggestTitle: boolean
}

// 音声レビューAI解析結果
export interface VoiceReviewResult {
    overallRating: number
    comfortRating?: number
    cushioningRating?: number
    stabilityRating?: number
    lightnessRating?: number
    gripRating?: number
    responsivenessRating?: number
    designRating?: number
    durabilityRating?: number
    stepInToeWidth?: number
    stepInInstepHeight?: number
    stepInHeelHold?: number
    fatigueSole?: number
    fatigueCalf?: number
    fatigueKnee?: number
    title: string
    content: string
    pros: string[]
    cons: string[]
    usagePeriod?: string
    onomatopoeia?: string
    purchaseSize?: string
}

// YouTube動画要約結果（著作権配慮版）
export interface YouTubeSummaryResult {
    videoInfo: {
        title: string
        channel: string
        videoId: string
        url: string
        thumbnailUrl?: string
    }
    summary: {
        title: string
        overallRating: number
        pros: string[]
        cons: string[]
        recommendedFor: string
        summary: string
    }
    copyright: {
        sourceAttribution: string
        disclaimer: string
        originalUrl: string
    }
}
