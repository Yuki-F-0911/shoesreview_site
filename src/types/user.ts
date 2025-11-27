export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  username: string
  displayName: string
  password: string
}

export interface UpdateUserInput {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

