import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pgbouncer=true')) {
    const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?'
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}pgbouncer=true`
}

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
})

async function main() {
    const shoes = await prisma.shoe.findMany()
    const noImage = shoes.filter(s => s.imageUrls.length === 0)

    console.log(`総シューズ: ${shoes.length}件`)
    console.log(`画像あり: ${shoes.length - noImage.length}件`)
    console.log(`画像なし: ${noImage.length}件`)

    if (noImage.length > 0) {
        console.log('\n=== 画像なしシューズ ===')
        noImage.forEach(s => console.log(`- ${s.brand} ${s.modelName}`))
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
