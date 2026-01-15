/**
 * Strava API クライアント
 */

import type {
    StravaTokenResponse,
    StravaActivity,
    StravaActivityDetail,
    StravaGear,
    StravaAthlete,
} from '@/types/strava'

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth'

/**
 * Strava認証URLを生成
 */
export function getStravaAuthUrl(state?: string): string {
    const clientId = process.env.STRAVA_CLIENT_ID
    const redirectUri = process.env.STRAVA_REDIRECT_URI
    const scope = 'read,profile:read_all,activity:read_all'

    if (!clientId || !redirectUri) {
        throw new Error('Strava環境変数が設定されていません')
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        ...(state && { state }),
    })

    return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`
}

/**
 * 認証コードをアクセストークンに交換
 */
export async function exchangeCodeForToken(
    code: string
): Promise<StravaTokenResponse> {
    const clientId = process.env.STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('Strava環境変数が設定されていません')
    }

    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`Stravaトークン取得エラー: ${JSON.stringify(error)}`)
    }

    return response.json()
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<StravaTokenResponse> {
    const clientId = process.env.STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('Strava環境変数が設定されていません')
    }

    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`Stravaトークン更新エラー: ${JSON.stringify(error)}`)
    }

    return response.json()
}

/**
 * アクセストークンを無効化
 */
export async function deauthorize(accessToken: string): Promise<void> {
    const response = await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            access_token: accessToken,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`Strava連携解除エラー: ${JSON.stringify(error)}`)
    }
}

/**
 * Strava APIクライアント
 */
export class StravaClient {
    private accessToken: string

    constructor(accessToken: string) {
        this.accessToken = accessToken
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Strava APIエラー: ${JSON.stringify(error)}`)
        }

        return response.json()
    }

    /**
     * 認証済みアスリート情報を取得
     */
    async getAthlete(): Promise<StravaAthlete> {
        return this.fetch<StravaAthlete>('/athlete')
    }

    /**
     * アクティビティ一覧を取得
     * @param page ページ番号（1から開始）
     * @param perPage 1ページあたりの件数（最大200）
     * @param before Unix timestamp以前のアクティビティ
     * @param after Unix timestamp以降のアクティビティ
     */
    async getActivities(options?: {
        page?: number
        perPage?: number
        before?: number
        after?: number
    }): Promise<StravaActivity[]> {
        const params = new URLSearchParams()
        if (options?.page) params.set('page', String(options.page))
        if (options?.perPage) params.set('per_page', String(options.perPage))
        if (options?.before) params.set('before', String(options.before))
        if (options?.after) params.set('after', String(options.after))

        const query = params.toString()
        return this.fetch<StravaActivity[]>(
            `/athlete/activities${query ? `?${query}` : ''}`
        )
    }

    /**
     * アクティビティ詳細を取得
     */
    async getActivity(activityId: number): Promise<StravaActivityDetail> {
        return this.fetch<StravaActivityDetail>(`/activities/${activityId}`)
    }

    /**
     * 全ギア（シューズ）を取得
     * アスリート情報から取得する必要があるため、別途実装
     */
    async getGear(gearId: string): Promise<StravaGear> {
        return this.fetch<StravaGear>(`/gear/${gearId}`)
    }

    /**
     * ランニングアクティビティのみをフィルタ
     */
    async getRunningActivities(options?: {
        page?: number
        perPage?: number
        before?: number
        after?: number
    }): Promise<StravaActivity[]> {
        const activities = await this.getActivities(options)
        return activities.filter(
            (activity) =>
                activity.type === 'Run' ||
                activity.sport_type === 'Run' ||
                activity.sport_type === 'TrailRun' ||
                activity.sport_type === 'VirtualRun'
        )
    }
}
