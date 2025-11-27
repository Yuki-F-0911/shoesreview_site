import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const createShoeSchema = z.object({
  brand: z.string().min(1, 'ブランド名を入力してください'),
  modelName: z.string().min(1, 'モデル名を入力してください'),
  category: z.string().min(1, 'カテゴリーを入力してください'),
  releaseYear: z.number().optional(),
  officialPrice: z.number().optional(),
  imageUrls: z.array(z.string().url()).optional().default([]),
  description: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const category = searchParams.get('category')

    const where: any = {}

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' }
    }

    if (category) {
      where.category = category
    }

    const shoes = await prisma.shoe.findMany({
      where,
      orderBy: [
        { brand: 'asc' },
        { modelName: 'asc' },
      ],
    })

    return NextResponse.json({ success: true, data: shoes })
  } catch (error) {
    console.error('Get shoes error:', error)
    return NextResponse.json({ error: 'シューズの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createShoeSchema.parse(body)

    const shoe = await prisma.shoe.create({
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: shoe }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error },
        { status: 400 }
      )
    }

    console.error('Create shoe error:', error)
    return NextResponse.json({ error: 'シューズの作成に失敗しました' }, { status: 500 })
  }
}

