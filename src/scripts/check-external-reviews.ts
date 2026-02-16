import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.externalReview.count()
    console.log('Total external reviews:', count)

    const byPlatform = await prisma.externalReview.groupBy({
        by: ['platform'],
        _count: true,
    })
    console.log('\nBy platform:')
    byPlatform.forEach(p => console.log(`  ${p.platform}: ${p._count}`))

    const bySentiment = await prisma.externalReview.groupBy({
        by: ['sentiment'],
        _count: true,
    })
    console.log('\nBy sentiment:')
    bySentiment.forEach(s => console.log(`  ${s.sentiment}: ${s._count}`))

    const byLanguage = await prisma.externalReview.groupBy({
        by: ['language'],
        _count: true,
    })
    console.log('\nBy language:')
    byLanguage.forEach(l => console.log(`  ${l.language}: ${l._count}`))

    // サンプル表示
    const samples = await prisma.externalReview.findMany({
        take: 3,
        include: { shoe: { select: { brand: true, modelName: true } } },
        orderBy: { collectedAt: 'desc' },
    })
    console.log('\nRecent samples:')
    samples.forEach(s => {
        console.log(`  ${s.shoe.brand} ${s.shoe.modelName} [${s.platform}]`)
        console.log(`    Title: ${s.sourceTitle?.substring(0, 60)}`)
        console.log(`    Summary: ${s.aiSummary?.substring(0, 80)}`)
        console.log(`    Sentiment: ${s.sentiment}`)
        console.log(`    URL: ${s.sourceUrl}`)
        console.log()
    })

    await prisma.$disconnect()
}

main()
