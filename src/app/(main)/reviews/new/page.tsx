import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { ReviewForm } from '@/components/reviews/ReviewForm'

async function getShoes() {
  return await prisma.shoe.findMany({
    orderBy: [
      { brand: 'asc' },
      { modelName: 'asc' },
    ],
  })
}

export default async function NewReviewPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const shoes = await getShoes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center">
        <ReviewForm shoes={shoes} />
      </div>
    </div>
  )
}

