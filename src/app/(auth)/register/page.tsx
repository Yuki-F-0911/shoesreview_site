import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <RegisterForm />
        <div className="mt-4 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-gray-900 underline">
            こちらからログイン
          </Link>
        </div>
      </div>
    </div>
  )
}

