
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const lines: string[] = []
    const log = (msg: string) => {
        console.log(msg)
        lines.push(msg)
    }
    log('Checking for admin user and reviews...')

    // 1. Find user with "admin" in username or email
    const adminUsers = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: 'admin', mode: 'insensitive' } },
                { email: { contains: 'admin', mode: 'insensitive' } }
            ]
        },
        include: {
            reviews: {
                include: {
                    shoe: true
                }
            }
        }
    })

    if (adminUsers.length === 0) {
        log('No user found with "admin" in username or email.')
    } else {
        log(`Found ${adminUsers.length} potential admin users:`)
        for (const user of adminUsers) {
            log(`User: ${user.username} (${user.email}), ID: ${user.id}`)
            log(` - Reviews count: ${user.reviews.length}`)
            user.reviews.forEach(r => {
                log(`   - Review ID: ${r.id}, Shoe: ${r.shoe.brand} ${r.shoe.modelName}, Title: ${r.title}`)
            })
        }
    }

    fs.writeFileSync('admin_check_result.txt', lines.join('\n'))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
