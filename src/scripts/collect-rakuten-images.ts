/**
 * 楽天商品検索APIを使用してシューズ画像を収集するスクリプト
 * 
 * 使用方法:
 * npx ts-node src/scripts/collect-rakuten-images.ts
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
    smallImageUrls: { imageUrl: string }[]
}

interface RakutenResponse {
    Items: { Item: RakutenItem }[]
    count: number
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
        genreId: '558885', // スポーツ・アウトドア > ランニング・マラソン > シューズ
        hits: '5',
        sort: '-reviewCount',
    })

    // アフィリエイトIDがあれば追加
    if (RAKUTEN_AFFILIATE_ID) {
        params.append('affiliateId', RAKUTEN_AFFILIATE_ID)
    }

    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params.toString()}`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            const text = await response.text()
            console.error(`Rakuten API error: ${response.status} - ${text}`)
            return []
        }

        const data = await response.json() as RakutenResponse
        return data.Items?.map(item => item.Item) || []
    } catch (error) {
        console.error(`Rakuten API fetch error: ${error}`)
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
    console.log('楽天API画像収集スクリプト（全シューズ対象）')
    console.log('='.repeat(60))

    if (!RAKUTEN_APP_ID) {
        console.error('\nエラー: RAKUTEN_APPLICATION_ID が設定されていません')
        process.exit(1)
    }

    console.log(`\nアプリID: ${RAKUTEN_APP_ID.substring(0, 10)}...`)
    console.log(`アフィリエイトID: ${RAKUTEN_AFFILIATE_ID ? 'あり' : 'なし'}`)

    // 全シューズを取得（画像の有無に関わらず）
    const allShoes = await prisma.shoe.findMany({
        orderBy: { brand: 'asc' }
    })

    console.log(`\n対象シューズ数: ${allShoes.length}`)
    console.log('')

    let successCount = 0
    let failCount = 0
    let skipCount = 0

    for (let i = 0; i < allShoes.length; i++) {
        const shoe = allShoes[i]
        const keyword = `${shoe.brand} ${shoe.modelName}`
        console.log(`[${i + 1}/${allShoes.length}] ${shoe.brand} ${shoe.modelName}`)

        try {
            const items = await searchRakuten(keyword)

            if (items.length > 0) {
                const item = items[0]
                const imageUrl = item.mediumImageUrls?.[0]?.imageUrl

                if (imageUrl) {
                    const highResUrl = getHighResImageUrl(imageUrl)

                    // 同じ画像なら更新しない
                    if (shoe.imageUrls.length > 0 && shoe.imageUrls[0] === highResUrl) {
                        console.log(`  -> スキップ: 同じ画像`)
                        skipCount++
                    } else {
                        await prisma.shoe.update({
                            where: { id: shoe.id },
                            data: {
                                imageUrls: [highResUrl]
                            }
                        })
                        console.log(`  -> 更新: ${highResUrl.substring(0, 50)}...`)
                        successCount++
                    }
                } else {
                    console.log(`  -> 失敗: 画像URLなし`)
                    failCount++
                }
            } else {
                console.log(`  -> 失敗: 商品見つからず`)
                failCount++
            }
        } catch (error) {
            console.log(`  -> エラー: ${error}`)
            failCount++
        }

        // レート制限対策 (1秒待機)
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n' + '='.repeat(60))
    console.log('完了')
    console.log(`更新: ${successCount}件`)
    console.log(`スキップ: ${skipCount}件`)
    console.log(`失敗: ${failCount}件`)
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
