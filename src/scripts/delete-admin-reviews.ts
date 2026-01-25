
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting reviews for user "admin"...')

    const adminUser = await prisma.user.findFirst({
        where: {
            username: 'admin'
        }
    })

    if (!adminUser) {
        console.log('User "admin" not found.')
        return
    }

    const deleteResult = await prisma.review.deleteMany({
        where: {
            userId: adminUser.id
        }
    })

    console.log(`Deleted ${deleteResult.count} reviews for user "admin" (${adminUser.id}).`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
