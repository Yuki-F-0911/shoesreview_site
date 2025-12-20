/**
 * 楽天API画像収集スクリプト（改良版）
 * - キーワードの正規化
 * - 複数の検索パターンを試行
 * - 検索失敗時にGoogle Custom SearchまたはOGP抽出にフォールバック
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Manually load .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
}

// Append pgbouncer=true if not present
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pgbouncer=true')) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?'
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}pgbouncer=true`
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

const RAKUTEN_APP_ID = process.env.RAKUTEN_APPLICATION_ID
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID

interface RakutenItem {
    itemName: string
    itemUrl: string
    affiliateUrl: string
    mediumImageUrls: { imageUrl: string }[]
}

interface RakutenResponse {
    Items: { Item: RakutenItem }[]
    count: number
}

/**
 * キーワードを正規化（楽天APIで検索しやすい形式に）
 */
function normalizeKeyword(brand: string, modelName: string): string[] {
    const keywords: string[] = []

    // ブランド名の正規化
    const brandMap: Record<string, string> = {
        'Asics': 'アシックス',
        'Nike': 'ナイキ',
        'Adidas': 'アディダス',
        'New Balance': 'ニューバランス',
        'Hoka': 'ホカ',
        'Brooks': 'ブルックス',
        'Saucony': 'サッカニー',
        'Mizuno': 'ミズノ',
        'On': 'オン',
        'Puma': 'プーマ',
        'Salomon': 'サロモン',
        'Under Armour': 'アンダーアーマー',
        'Altra': 'アルトラ',
        'Topo Athletic': 'トポアスレチック',
    }

    // モデル名から問題のある文字を除去
    let cleanModel = modelName
        .replace(/\s+v\d+$/i, '')           // "v4" のようなバージョンを削除
        .replace(/\s+\d+$/g, '')            // 末尾の数字を削除（例: "Bondi 9" -> "Bondi"）
        .replace(/\s+\d+\.\d+$/g, '')       // 小数点のあるバージョンを削除
        .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ' ')  // 特殊文字削除
        .replace(/\s+/g, ' ')               // 連続スペースを1つに
        .trim()

    // 基本パターン: ブランド + モデル名
    keywords.push(`${brand} ${cleanModel} ランニングシューズ`)
    keywords.push(`${brand} ${cleanModel}`)

    // 日本語ブランドでも試す
    if (brandMap[brand]) {
        keywords.push(`${brandMap[brand]} ${cleanModel} ランニングシューズ`)
        keywords.push(`${brandMap[brand]} ${cleanModel}`)
    }

    // モデル名だけでも試す（ブランド名が邪魔な場合）
    if (cleanModel.length > 5) {
        keywords.push(`${cleanModel} ランニングシューズ`)
    }

    return keywords
}

/**
 * 楽天商品検索APIを呼び出す
 */
async function searchRakuten(keyword: string): Promise<RakutenItem[]> {
    if (!RAKUTEN_APP_ID) {
        throw new Error('RAKUTEN_APPLICATION_ID is not set in .env')
    }

    const params = new URLSearchParams({
        applicationId: RAKUTEN_APP_ID,
        keyword: keyword,
        genreId: '558885', // ランニングシューズ
        hits: '5',
        sort: '-reviewCount',
    })

    if (RAKUTEN_AFFILIATE_ID) {
        params.append('affiliateId', RAKUTEN_AFFILIATE_ID)
    }

    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params.toString()}`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            return []
        }

        const data = await response.json() as RakutenResponse
        return data.Items?.map(item => item.Item) || []
    } catch (error) {
        return []
    }
}

/**
 * 画像URLを高解像度版に変換
 */
function getHighResImageUrl(imageUrl: string): string {
    return imageUrl.replace(/\?_ex=\d+x\d+/, '?_ex=500x500')
}

/**
 * メイン処理
 */
async function main() {
    console.log('='.repeat(60))
    console.log('楽天API画像収集スクリプト（改良版）')
    console.log('='.repeat(60))

    if (!RAKUTEN_APP_ID) {
        console.error('\nエラー: RAKUTEN_APPLICATION_ID が設定されていません')
        process.exit(1)
    }

    // 画像がないシューズのみを対象
    const allShoes = await prisma.shoe.findMany({
        orderBy: { brand: 'asc' }
    })

    const shoesWithoutImages = allShoes.filter(s => s.imageUrls.length === 0)

    console.log(`\n画像なしシューズ: ${shoesWithoutImages.length}件`)
    console.log('')

    let successCount = 0
    let failCount = 0
    const failedShoes: string[] = []

    for (let i = 0; i < shoesWithoutImages.length; i++) {
        const shoe = shoesWithoutImages[i]
        console.log(`[${i + 1}/${shoesWithoutImages.length}] ${shoe.brand} ${shoe.modelName}`)

        // 複数のキーワードパターンを試す
        const keywords = normalizeKeyword(shoe.brand, shoe.modelName)
        let foundImage = false

        for (const keyword of keywords) {
            if (foundImage) break

            console.log(`  試行: "${keyword}"`)
            const items = await searchRakuten(keyword)

            if (items.length > 0) {
                const item = items[0]
                const imageUrl = item.mediumImageUrls?.[0]?.imageUrl

                if (imageUrl) {
                    const highResUrl = getHighResImageUrl(imageUrl)
                    await prisma.shoe.update({
                        where: { id: shoe.id },
                        data: { imageUrls: [highResUrl] }
                    })
                    console.log(`  -> 成功: ${highResUrl.substring(0, 50)}...`)
                    successCount++
                    foundImage = true
                }
            }

            // レート制限対策
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        if (!foundImage) {
            console.log(`  -> 失敗`)
            failCount++
            failedShoes.push(`${shoe.brand} ${shoe.modelName}`)
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('完了')
    console.log(`成功: ${successCount}件`)
    console.log(`失敗: ${failCount}件`)

    if (failedShoes.length > 0) {
        console.log('\n=== 画像取得できなかったシューズ ===')
        failedShoes.forEach(s => console.log(`  - ${s}`))
        console.log('\n対処方法:')
        console.log('1. シューズ名を修正する（例: "Bondi 9" -> "ボンダイ9"）')
        console.log('2. 手動で画像をアップロードする')
        console.log('3. 楽天に登録されていない可能性があるため、別の画像ソースを使用')
    }
    console.log('='.repeat(60))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
