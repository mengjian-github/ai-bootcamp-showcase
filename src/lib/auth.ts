import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface AuthUser {
  userId: string
  planetNumber: string
  role: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export function getAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === 'ADMIN'
}

export function requireAuth(request: NextRequest): AuthUser | null {
  const token = getAuthHeader(request)
  if (!token) {
    return null
  }

  const user = verifyToken(token)
  return user
}

export function requireAdmin(request: NextRequest): AuthUser | null {
  const user = requireAuth(request)
  if (!user || !isAdmin(user)) {
    return null
  }
  return user
}