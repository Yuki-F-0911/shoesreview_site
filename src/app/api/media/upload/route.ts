import { NextResponse } from 'next/server'
import { MediaStatus, ShoeMediaSource } from '@prisma/client'
import { auth } from '@/lib/auth/auth'
import { isAdminEmail } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma/client'
import { uploadPngToStorage } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'ファイルが添付されていません' }, { status: 400 })
  }

  if (file.type !== 'image/png') {
    return NextResponse.json({ error: 'PNG形式のみアップロードできます' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
  }

  const shoeId = formData.get('shoeId')?.toString()
  const altText = formData.get('altText')?.toString()
  const isPrimary = formData.get('isPrimary') === 'true'
  const tags = formData
    .getAll('tags')
    .map((tag) => tag.toString())
    .filter(Boolean)

  if (shoeId) {
    const shoeExists = await prisma.shoe.count({ where: { id: shoeId } })
    if (!shoeExists) {
      return NextResponse.json({ error: 'シューズが存在しません' }, { status: 404 })
    }
  }

  const { path, publicUrl } = await uploadPngToStorage(buffer, {
    prefix: shoeId ? `shoes/${shoeId}` : `users/${session.user.id}`,
  })

  let mediaRecord = null

  if (shoeId) {
    const isAdmin = isAdminEmail(session.user?.email)
    mediaRecord = await prisma.shoeMedia.create({
      data: {
        shoeId,
        storagePath: path,
        publicUrl,
        altText,
        tags,
        isPrimary,
        sourceType: isAdmin ? ShoeMediaSource.ADMIN : ShoeMediaSource.USER,
        status: isAdmin ? MediaStatus.APPROVED : MediaStatus.PENDING,
        uploadedById: session.user.id,
        fileSize: buffer.byteLength,
      },
    })

    if (isPrimary) {
      await prisma.shoeMedia.updateMany({
        where: {
          shoeId,
          id: { not: mediaRecord.id },
        },
        data: { isPrimary: false },
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      url: publicUrl,
      path,
      media: mediaRecord,
    },
  })
}


