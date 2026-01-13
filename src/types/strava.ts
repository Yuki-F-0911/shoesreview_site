/**
 * Strava API 型定義
 */

// OAuth認証レスポンス
export interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: StravaAthlete
}

// アスリート情報
export interface StravaAthlete {
  id: number
  username: string | null
  firstname: string
  lastname: string
  city: string | null
  state: string | null
  country: string | null
  sex: 'M' | 'F' | null
  premium: boolean
  summit: boolean
  created_at: string
  updated_at: string
  profile: string
  profile_medium: string
}

// アクティビティ
export interface StravaActivity {
  id: number
  name: string
  distance: number // メートル
  moving_time: number // 秒
  elapsed_time: number // 秒
  total_elevation_gain: number // メートル
  type: string // "Run", "Ride", etc.
  sport_type: string
  start_date: string // ISO 8601
  start_date_local: string
  timezone: string
  utc_offset: number
  average_speed: number // m/s
  max_speed: number // m/s
  average_cadence?: number
  average_heartrate?: number
  max_heartrate?: number
  gear_id: string | null
  map?: {
    id: string
    summary_polyline: string
    polyline?: string
  }
}

// ギア（シューズ）
export interface StravaGear {
  id: string
  primary: boolean
  name: string
  distance: number // メートル
  brand_name?: string
  model_name?: string
  description?: string
  retired?: boolean
}

// アクティビティ詳細
export interface StravaActivityDetail extends StravaActivity {
  description: string | null
  calories: number
  gear?: StravaGear
  splits_metric?: StravaSplit[]
  laps?: StravaLap[]
}

// スプリット
export interface StravaSplit {
  distance: number
  elapsed_time: number
  elevation_difference: number
  moving_time: number
  split: number
  average_speed: number
  pace_zone: number
}

// ラップ
export interface StravaLap {
  id: number
  name: string
  activity: { id: number }
  athlete: { id: number }
  elapsed_time: number
  moving_time: number
  start_date: string
  start_date_local: string
  distance: number
  average_speed: number
  max_speed: number
  lap_index: number
  split: number
  pace_zone?: number
}

// Strava連携設定
export interface StravaConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
}

// API エラー
export interface StravaAPIError {
  message: string
  errors: Array<{
    resource: string
    field: string
    code: string
  }>
}
