/**
 * NextAuth.js 5.0用の設定
 */
import NextAuth from 'next-auth'
import { authOptions } from './auth-options'

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)


