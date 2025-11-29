
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

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

const newShoes = [
    // Track Race (Spikes/Legal < 25mm)
    { brand: 'Nike', modelName: 'ZoomX Dragonfly 2', category: 'トラックレース', description: '5000m-10000m向けの長距離スパイク。軽量で高反発。' },
    { brand: 'Nike', modelName: 'Air Zoom Victory 2', category: 'トラックレース', description: '800m-5000m向けの中距離スパイク。Air Zoomユニット搭載。' },
    { brand: 'Adidas', modelName: 'Adizero Ambition', category: 'トラックレース', description: '中距離（800m-1500m）向けの高反発スパイク。' },
    { brand: 'Adidas', modelName: 'Adizero Avanti TYO', category: 'トラックレース', description: '長距離トラックレース向けの疲労軽減モデル。' },
    { brand: 'Asics', modelName: 'Metaspeed LD 2', category: 'トラックレース', description: 'ピンレスカーボンプレート搭載の長距離スパイク。' },
    { brand: 'Asics', modelName: 'Metaspeed MD', category: 'トラックレース', description: '中距離向けのストライド伸長型スパイク。' },

    // Tempo (Up-tempo training/racing)
    { brand: 'Adidas', modelName: 'Adizero Takumi Sen 10', category: 'テンポ', description: '5km-10kmレースやスピード練習に最適な薄底高反発シューズ。' },
    { brand: 'Nike', modelName: 'Streakfly', category: 'テンポ', description: '5km-10km向けの軽量レーシングシューズ。' },
    { brand: 'Asics', modelName: 'Magic Speed 4', category: 'テンポ', description: 'カーボンプレート搭載のトレーニング兼レースシューズ。' },
    { brand: 'New Balance', modelName: 'FuelCell SuperComp Pacer v2', category: 'テンポ', description: '爆発的な反発力を持つ短距離・スピード練習向けモデル。' },

    // Daily Training (High mileage, versatile)
    { brand: 'Asics', modelName: 'Superblast 2', category: 'デイリートレーニング', description: '超厚底かつ軽量、ジョグからロング走まで対応するスーパー・デイリートレーナー。' },
    { brand: 'Nike', modelName: 'Pegasus Plus', category: 'デイリートレーニング', description: 'Pegasus Turboの系譜を継ぐ、反発性に優れたデイリートレーナー。' },
    { brand: 'Brooks', modelName: 'Ghost Max 2', category: 'デイリートレーニング', description: '保護機能を重視したマックスクッション・デイリートレーナー。' },
    { brand: 'New Balance', modelName: 'Fresh Foam X Balos', category: 'デイリートレーニング', description: 'ロッカー構造と高反発素材を組み合わせた新しいトレーニングモデル。' },
]

async function main() {
    console.log('Starting new category shoes import...')
    console.log(`Found ${newShoes.length} shoes to import.`)

    for (const shoe of newShoes) {
        const existing = await prisma.shoe.findFirst({
            where: {
                brand: shoe.brand,
                modelName: shoe.modelName,
            },
        })

        if (existing) {
            console.log(`Skipping existing shoe: ${shoe.brand} ${shoe.modelName}`)
            // Optional: Update category if it exists but is different? 
            // For now, let's just skip to avoid overwriting user data unless requested.
            continue
        }

        await prisma.shoe.create({
            data: {
                brand: shoe.brand,
                modelName: shoe.modelName,
                category: shoe.category,
                description: shoe.description,
                releaseYear: 2024,
                officialPrice: 0,
                imageUrls: [],
                keywords: [shoe.category, 'トラック', 'スパイク', 'テンポ', 'トレーニング'],
            },
        })
        console.log(`Imported: ${shoe.brand} ${shoe.modelName} (${shoe.category})`)
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
