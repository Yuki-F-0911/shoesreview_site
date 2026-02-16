import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
    const c = await p.externalReview.count()
    console.log(`COUNT=${c}`)
    await p.$disconnect()
}
main()
