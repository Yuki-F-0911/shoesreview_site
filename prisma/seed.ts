import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // テストユーザーの作成
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'yuki0911hanshin@gmail.com' },
    update: {},
    create: {
      email: 'yuki0911hanshin@gmail.com',
      username: 'admin',
      displayName: 'admin',
      password: hashedPassword,
      bio: '管理者です',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demouser',
      displayName: 'デモユーザー',
      password: hashedPassword,
    },
  })

  // シューズの作成
  const shoe1 = await prisma.shoe.create({
    data: {
      brand: 'Nike',
      modelName: 'Air Max 90',
      category: 'ランニング',
      releaseYear: 2023,
      officialPrice: 12000,
      imageUrls: [],
      keywords: ['ランニング', 'クッション'],
      locale: 'ja-JP',
      region: 'JP',
      description: 'クラシックなデザインのランニングシューズ',
    },
  })

  const shoe2 = await prisma.shoe.create({
    data: {
      brand: 'Adidas',
      modelName: 'Ultraboost 23',
      category: 'ランニング',
      releaseYear: 2023,
      officialPrice: 15000,
      imageUrls: [],
      keywords: ['マラソン', 'クッション'],
      locale: 'ja-JP',
      region: 'JP',
      description: '高クッション性のランニングシューズ',
    },
  })

  const shoe3 = await prisma.shoe.create({
    data: {
      brand: 'Converse',
      modelName: 'Chuck Taylor All Star',
      category: 'カジュアル',
      releaseYear: 2022,
      officialPrice: 6000,
      imageUrls: [],
      keywords: ['カジュアル', 'キャンバス'],
      locale: 'ja-JP',
      region: 'JP',
      description: '定番のスニーカー',
    },
  })

  // レビューの作成
  await prisma.review.create({
    data: {
      shoeId: shoe1.id,
      userId: user1.id,
      type: 'USER',
      overallRating: 5,
      comfortRating: 5,
      designRating: 5,
      durabilityRating: 4,
      title: '最高のランニングシューズ',
      content: '履き心地が抜群で、長時間履いても疲れません。デザインもシンプルで好きです。',
      imageUrls: [],
      usagePeriod: '6ヶ月',
      usageScene: ['ランニング', 'ウォーキング'],
      pros: ['履き心地が良い', 'デザインが良い'],
      cons: ['少し高価'],
    },
  })

  await prisma.review.create({
    data: {
      shoeId: shoe2.id,
      userId: user2.id,
      type: 'USER',
      overallRating: 4,
      comfortRating: 5,
      designRating: 4,
      durabilityRating: 4,
      title: 'クッション性が素晴らしい',
      content: 'クッション性が高く、長時間のランニングでも快適です。',
      imageUrls: [],
      usagePeriod: '3ヶ月',
      usageScene: ['ランニング'],
      pros: ['クッション性が高い'],
      cons: ['価格が高い'],
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

