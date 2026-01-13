import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Manually load .env file to ensure DATABASE_URL is available
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

const shoes = [
    { brand: 'Nike', modelName: 'Pegasus 41', category: 'ランニング', description: '信頼性の高いデイリートレーナー' },
    { brand: 'Nike', modelName: 'Alphafly 3', category: 'レース', description: 'マラソン世界記録保持モデル' },
    { brand: 'Nike', modelName: 'Zegama 2', category: 'トレイル', description: '高反発なトレイルランニングシューズ' },
    { brand: 'Asics', modelName: 'Gel-Kayano 31', category: 'スタビリティ', description: '優れた安定性とクッション性' },
    { brand: 'Asics', modelName: 'Metaspeed Sky Paris', category: 'レース', description: 'ストライド型ランナー向けレーシング' },
    { brand: 'New Balance', modelName: 'Fresh Foam X 1080 v13', category: 'クッション', description: '極上のクッション性を提供するデイリートレーナー' },
    { brand: 'New Balance', modelName: 'FuelCell SuperComp Elite v4', category: 'レース', description: '反発性とエネルギーリターンを追求' },
    { brand: 'New Balance', modelName: 'FuelCell Rebel v4', category: 'ランニング', description: '軽量でスピード練習に最適' },
    { brand: 'Hoka', modelName: 'Mach 6', category: 'ランニング', description: '軽量で反発性のあるスピードモデル' },
    { brand: 'Hoka', modelName: 'Speedgoat 6', category: 'トレイル', description: 'テクニカルなトレイルに対応するグリップ力' },
    { brand: 'Saucony', modelName: 'Triumph 22', category: 'クッション', description: '長距離でも快適なクッションモデル' },
    { brand: 'Saucony', modelName: 'Kinvara 15', category: 'ランニング', description: 'ナチュラルな走り心地の軽量モデル' },
    { brand: 'Mizuno', modelName: 'Wave Rider 28', category: 'ランニング', description: 'スムーズな体重移動をサポート' },
    { brand: 'On', modelName: 'Cloudmonster 2', category: 'クッション', description: 'モンスター級のクッションと反発力' },
    { brand: 'Altra', modelName: 'Torin 8', category: 'ランニング', description: 'ゼロドロップで自然な走り心地' },
    { brand: 'Topo Athletic', modelName: 'Cyclone 2', category: 'ランニング', description: '超軽量で反発性のあるPebax搭載モデル' },
    { brand: 'Salomon', modelName: 'Genesis', category: 'トレイル', description: 'あらゆる地形に対応するマウンテンランニングシューズ' },
    { brand: 'Brooks', modelName: 'Glycerin 21', category: 'クッション', description: '最高級の柔らかさを追求したクッションモデル' },
    { brand: 'Puma', modelName: 'Deviate Nitro 3', category: 'ランニング', description: 'カーボンプレート搭載のトレーニングモデル' },
    { brand: 'Adidas', modelName: 'Adizero Boston 13', category: 'ランニング', description: 'レース本番のような走り心地のトレーニングシューズ' },
]

async function main() {
    console.log('Starting additional shoes import...')
    console.log(`Found ${shoes.length} shoes to import.`)

    for (const shoe of shoes) {
        const existing = await prisma.shoe.findFirst({
            where: {
                brand: shoe.brand,
                modelName: shoe.modelName,
            },
        })

        if (existing) {
            console.log(`Skipping existing shoe: ${shoe.brand} ${shoe.modelName}`)
            continue
        }

        await prisma.shoe.create({
            data: {
                brand: shoe.brand,
                modelName: shoe.modelName,
                category: shoe.category,
                description: shoe.description,
                releaseYear: 2024, // Assuming most are 2024/2025 models
                officialPrice: 0,
                imageUrls: [],
                keywords: [shoe.category, '最新モデル'],
            },
        })
        console.log(`Imported: ${shoe.brand} ${shoe.modelName}`)
    }

    console.log('Import complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
