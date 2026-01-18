import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { registerSchema } from '@/lib/validations/user'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // メールアドレスとユーザー名の重複チェック
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { username: validatedData.username }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスまたはユーザー名は既に使用されています' },
        { status: 400 }
      )
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        displayName: validatedData.displayName,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '入力データが正しくありません',
          details: error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}

