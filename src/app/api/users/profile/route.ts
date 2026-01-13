import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { profileSchema } from '@/lib/validations/profile'

// GET: 現在のユーザープロフィールを取得
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                runnerAge: true,
                runnerGender: true,
                runnerGenderPublic: true,
                runnerHeight: true,
                runnerWeight: true,
                runnerWeeklyDistance: true,
                runnerPersonalBest: true,
                runnerExpertise: true,
                runnerFootShape: true,
                runnerLandingType: true,
            } as any,
        })

        if (!user) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
        }

        return NextResponse.json({ data: user })
    } catch (error) {
        console.error('Failed to fetch profile:', error)
        return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 })
    }
}

// PUT: ユーザープロフィールを更新
export async function PUT(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const body = await request.json()
        const validated = profileSchema.parse(body)

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                runnerAge: validated.runnerAge,
                runnerGender: validated.runnerGender,
                runnerGenderPublic: validated.runnerGenderPublic,
                runnerHeight: validated.runnerHeight,
                runnerWeight: validated.runnerWeight,
                runnerWeeklyDistance: validated.runnerWeeklyDistance,
                runnerPersonalBest: validated.runnerPersonalBest,
                runnerExpertise: validated.runnerExpertise,
                runnerFootShape: validated.runnerFootShape,
                runnerLandingType: validated.runnerLandingType,
            } as any,
            select: {
                runnerAge: true,
                runnerGender: true,
                runnerGenderPublic: true,
                runnerHeight: true,
                runnerWeight: true,
                runnerWeeklyDistance: true,
                runnerPersonalBest: true,
                runnerExpertise: true,
                runnerFootShape: true,
                runnerLandingType: true,
            } as any,
        })

        return NextResponse.json({ data: user })
    } catch (error) {
        console.error('Failed to update profile:', error)
        return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 })
    }
}
