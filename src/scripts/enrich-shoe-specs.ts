import { Prisma, PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const DELAY_MS = 2000

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGemini(prompt: string, maxRetries = 3): Promise<string | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429')
      if (isRateLimit && attempt < maxRetries) {
        const waitTime = 10000 * Math.pow(2, attempt)
        console.log(`  Rate limited, waiting ${waitTime / 1000}s...`)
        await sleep(waitTime)
        continue
      }
      console.error(`  Gemini API error:`, error?.message || error)
      return null
    }
  }
  return null
}

interface ShoeSpecs {
  weight?: string
  drop?: string
  stackHeight?: string
  midsoleTech?: string
  outsole?: string
  plateTech?: string
  upperMaterial?: string
  widthOptions?: string[]
  useCase?: string[]
}

interface EnrichmentResult {
  specifications: ShoeSpecs
  officialDescription?: string
  targetRunner?: string[]
  officialPrice?: number
}

async function enrichShoe(brand: string, modelName: string): Promise<EnrichmentResult | null> {
  const prompt = `You are a running shoe expert. For the shoe "${brand} ${modelName}", provide the following information in JSON format only (no markdown, no explanation):

{
  "specifications": {
    "weight": "weight in grams for US men's size 9 / 27cm, e.g. '245g (27cm)'",
    "drop": "heel-to-toe drop in mm, e.g. '8mm'",
    "stackHeight": "heel/forefoot stack height, e.g. '39mm / 31mm'",
    "midsoleTech": "midsole foam technology name",
    "outsole": "outsole material/pattern",
    "plateTech": "plate technology if any, or null",
    "upperMaterial": "upper material description",
    "widthOptions": ["available width options"],
    "useCase": ["primary use cases in Japanese, e.g. 'マラソン', 'トレーニング', 'ジョギング'"]
  },
  "officialDescription": "Brief Japanese description of the shoe (2-3 sentences, focusing on key features and target audience)",
  "targetRunner": ["target runner types in Japanese, e.g. 'サブ3ランナー', '初心者', 'トレイルランナー'"],
  "officialPrice": estimated retail price in JPY as integer (0 if unknown)
}

If you don't know a value, use null. Respond with ONLY valid JSON.`

  const response = await callGemini(prompt)
  if (!response) return null

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as EnrichmentResult
    return parsed
  } catch (e) {
    console.error(`  Failed to parse JSON for ${brand} ${modelName}`)
    return null
  }
}

async function main(): Promise<void> {
  console.log('=== Shoe Specifications Enrichment ===\n')

  const shoes = await prisma.shoe.findMany({
    where: {
      OR: [
        { specifications: { equals: Prisma.JsonNull } },
        { specifications: { equals: Prisma.DbNull } },
        { specifications: { equals: {} } },
      ],
    },
    select: {
      id: true,
      brand: true,
      modelName: true,
      officialDescription: true,
      officialPrice: true,
      targetRunner: true,
    },
    orderBy: { brand: 'asc' },
  })

  console.log(`Found ${shoes.length} shoes without specifications.\n`)

  if (shoes.length === 0) {
    console.log('All shoes already have specifications. Done.')
    await prisma.$disconnect()
    return
  }

  let enriched = 0
  let failed = 0

  for (const shoe of shoes) {
    console.log(`[${enriched + failed + 1}/${shoes.length}] ${shoe.brand} ${shoe.modelName}`)

    const result = await enrichShoe(shoe.brand, shoe.modelName)

    if (result?.specifications) {
      const updateData: Record<string, unknown> = {
        specifications: result.specifications,
      }

      if (!shoe.officialDescription && result.officialDescription) {
        updateData.officialDescription = result.officialDescription
      }
      if (shoe.targetRunner.length === 0 && result.targetRunner?.length) {
        updateData.targetRunner = result.targetRunner
      }
      if (!shoe.officialPrice && result.officialPrice && result.officialPrice > 0) {
        updateData.officialPrice = result.officialPrice
      }

      await prisma.shoe.update({
        where: { id: shoe.id },
        data: updateData,
      })

      enriched++
      console.log(`  ✓ Updated (${Object.keys(result.specifications).filter(k => (result.specifications as any)[k] != null).length} specs)`)
    } else {
      failed++
      console.log(`  ✗ Failed`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n=== Complete ===`)
  console.log(`Enriched: ${enriched}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${shoes.length}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal error:', e)
  prisma.$disconnect()
  process.exit(1)
})
