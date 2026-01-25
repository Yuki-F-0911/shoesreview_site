/**
 * Google Sheets API クライアント
 * データベースのバックアップをGoogle Sheetsに書き込む
 */

import { google } from 'googleapis'

// 環境変数の取得
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

/**
 * Google Sheets APIクライアントを初期化
 */
export function getGoogleSheetsClient() {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SPREADSHEET_ID) {
        throw new Error('Google Sheets環境変数が設定されていません')
    }

    const auth = new google.auth.JWT({
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    return google.sheets({ version: 'v4', auth })
}

/**
 * スプレッドシートIDを取得
 */
export function getSpreadsheetId(): string {
    if (!GOOGLE_SPREADSHEET_ID) {
        throw new Error('GOOGLE_SPREADSHEET_IDが設定されていません')
    }
    return GOOGLE_SPREADSHEET_ID
}

/**
 * シートをクリアしてデータを書き込む
 */
export async function writeToSheet(
    sheetName: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
): Promise<void> {
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    // シートが存在するか確認し、なければ作成
    try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
        const existingSheet = spreadsheet.data.sheets?.find(
            (s) => s.properties?.title === sheetName
        )

        if (!existingSheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: sheetName },
                            },
                        },
                    ],
                },
            })
        }
    } catch (error) {
        console.error('シート確認エラー:', error)
        throw error
    }

    // シートをクリア
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${sheetName}!A:ZZ`,
        })
    } catch (error) {
        // シートが空の場合はエラーを無視
        console.log(`シート ${sheetName} のクリア中にエラー（無視可能）:`, error)
    }

    // ヘッダーとデータを書き込み
    const values = [headers, ...rows.map((row) => row.map((cell) => cell ?? ''))]

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
    })

    console.log(`シート ${sheetName} に ${rows.length} 行を書き込みました`)
}

/**
 * メタデータシートに最終バックアップ日時を記録
 */
export async function updateBackupMetadata(): Promise<void> {
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    const sheetName = 'Metadata'

    // シートが存在するか確認し、なければ作成
    try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
        const existingSheet = spreadsheet.data.sheets?.find(
            (s) => s.properties?.title === sheetName
        )

        if (!existingSheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: sheetName },
                            },
                        },
                    ],
                },
            })
        }
    } catch (error) {
        console.error('Metadataシート確認エラー:', error)
    }

    const now = new Date().toISOString()
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:B2`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [
                ['Last Backup', 'Timestamp'],
                ['最終バックアップ', now],
            ],
        },
    })
}
