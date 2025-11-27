import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <div className="mt-4 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="text-gray-900 underline">
            こちらから登録
          </Link>
        </div>
      </div>
    </div>
  )
}

