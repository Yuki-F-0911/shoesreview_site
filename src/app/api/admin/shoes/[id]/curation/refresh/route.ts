import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { isAdminEmail } from '@/lib/auth/permissions'
import { refreshCuratedSourcesForShoe } from '@/lib/curation/service'
import { refreshCurationSchema } from '@/lib/validations/curation'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()

  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: '管理者のみが操作できます' }, { status: 403 })
  }

  const json = await request
    .json()
    .catch(() => ({}))

  const payload = refreshCurationSchema.parse(json ?? {})
  const result = await refreshCuratedSourcesForShoe(params.id, payload)

  return NextResponse.json({ success: true, data: result })
}


