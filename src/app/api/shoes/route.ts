import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

import { createShoeSchema } from '@/lib/validations/shoe'

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

