/**
 * YouTube動画要約機能
 * Pythonスクリプト（youtube_summarizer.py）を呼び出して要約を生成
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export interface YouTubeVideoInfo {
  title: string
  channel: string
  videoId: string
  url: string
}

export interface YouTubeSummary {
  title: string
  pros: string[]
  cons: string[]
  recommendedFor: string
  summary: string
}

export interface YouTubeSummarizeResult {
  videoInfo: YouTubeVideoInfo
  transcription: {
    text: string
    language: string
  }
  summary: YouTubeSummary
}

/**
 * YouTube動画を要約する
 * @param videoUrl YouTube動画のURL
 * @param shoeBrand シューズのブランド名（オプション）
 * @param shoeModel シューズのモデル名（オプション）
 * @returns 要約結果
 */
export async function summarizeYouTubeVideo(
  videoUrl: string,
  shoeBrand?: string,
  shoeModel?: string
): Promise<YouTubeSummarizeResult> {
  try {
    // Pythonスクリプトのパス
    const scriptPath = path.join(process.cwd(), 'youtube_summarizer.py')

    // Pythonスクリプトを実行
    const args = [
      videoUrl,
      shoeBrand || '',
      shoeModel || '',
    ].map(arg => `"${arg}"`).join(' ')

    // 環境変数を設定してPythonスクリプトを実行
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" ${args}`,
      {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    )

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python script stderr:', stderr)
    }

    // JSON結果をパース
    const result = JSON.parse(stdout.trim())
    return result
  } catch (error) {
    console.error('YouTube summarization error:', error)
    throw new Error(`YouTube動画の要約に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * YouTube動画URLから動画IDを抽出
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

