/**
 * 管理者用メディア管理API
 */

import { NextRequest, NextResponse } from 'next/server'
import { MediaStatus } from '@prisma/client'
import { auth } from '@/lib/auth/auth'
import { isAdminEmail } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as MediaStatus | null
  const shoeId = searchParams.get('shoeId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (shoeId) where.shoeId = shoeId

  const [media, total] = await Promise.all([
    prisma.shoeMedia.findMany({
      where,
      include: {
        shoe: {
          select: {
            id: true,
            brand: true,
            modelName: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shoeMedia.count({ where }),
  ])

  return NextResponse.json({
    data: media,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const body = await request.json()
  const { mediaId, action, isPrimary } = body

  if (!mediaId) {
    return NextResponse.json({ error: 'mediaIdが必要です' }, { status: 400 })
  }

  const media = await prisma.shoeMedia.findUnique({
    where: { id: mediaId },
  })

  if (!media) {
    return NextResponse.json({ error: 'メディアが見つかりません' }, { status: 404 })
  }

  // アクションに応じて更新
  if (action === 'approve') {
    await prisma.shoeMedia.update({
      where: { id: mediaId },
      data: { status: MediaStatus.APPROVED },
    })

    // シューズのimageUrlsに追加
    await prisma.shoe.update({
      where: { id: media.shoeId },
      data: {
        imageUrls: {
          push: media.publicUrl,
        },
      },
    })
  } else if (action === 'reject') {
    await prisma.shoeMedia.update({
      where: { id: mediaId },
      data: { status: MediaStatus.REJECTED },
    })
  } else if (typeof isPrimary === 'boolean') {
    if (isPrimary) {
      // 他のプライマリを解除
      await prisma.shoeMedia.updateMany({
        where: { shoeId: media.shoeId, isPrimary: true },
        data: { isPrimary: false },
      })
    }
    await prisma.shoeMedia.update({
      where: { id: mediaId },
      data: { isPrimary },
    })
  }

  const updatedMedia = await prisma.shoeMedia.findUnique({
    where: { id: mediaId },
    include: {
      shoe: {
        select: {
          id: true,
          brand: true,
          modelName: true,
        },
      },
    },
  })

  return NextResponse.json({ success: true, data: updatedMedia })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const mediaId = searchParams.get('id')

  if (!mediaId) {
    return NextResponse.json({ error: 'idが必要です' }, { status: 400 })
  }

  const media = await prisma.shoeMedia.findUnique({
    where: { id: mediaId },
  })

  if (!media) {
    return NextResponse.json({ error: 'メディアが見つかりません' }, { status: 404 })
  }

  // シューズのimageUrlsから削除
  const shoe = await prisma.shoe.findUnique({
    where: { id: media.shoeId },
    select: { imageUrls: true },
  })

  if (shoe) {
    await prisma.shoe.update({
      where: { id: media.shoeId },
      data: {
        imageUrls: shoe.imageUrls.filter((url) => url !== media.publicUrl),
      },
    })
  }

  await prisma.shoeMedia.delete({
    where: { id: mediaId },
  })

  return NextResponse.json({ success: true })
}

