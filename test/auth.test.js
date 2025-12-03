import { describe, it, expect, vi } from 'vitest'
import { generateToken, verifyToken, authMiddleware } from '../src/workers/auth.js'

describe('Authentication Functions', () => {
  const secret = 'test_secret'
  const payload = { username: 'testuser', role: 'admin' }

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const token = await generateToken(payload, secret)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await generateToken(payload, secret)
      const decoded = await verifyToken(token, secret)
      expect(decoded).toBeDefined()
      expect(decoded.username).toBe(payload.username)
      expect(decoded.role).toBe(payload.role)
    })

    it('should return null for an invalid token', async () => {
      const decoded = await verifyToken('invalid.token.here', secret)
      expect(decoded).toBeNull()
    })
  })

  describe('authMiddleware', () => {
    it('should return 401 for missing Authorization header', async () => {
      const request = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      }

      const env = {}
      const next = vi.fn()

      const response = await authMiddleware(request, env, next)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing Authorization header')
    })

    it('should return 401 for invalid Authorization header format', async () => {
      const request = {
        headers: {
          get: vi.fn().mockReturnValue('InvalidFormat token')
        }
      }

      const env = {}
      const next = vi.fn()

      const response = await authMiddleware(request, env, next)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid Authorization header format')
    })

    it('should return 401 for invalid token', async () => {
      const request = {
        headers: {
          get: vi.fn().mockReturnValue('Bearer invalid.token.here')
        }
      }

      const env = { JWT_SECRET: secret }
      const next = vi.fn()

      const response = await authMiddleware(request, env, next)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid or expired token')
    })
  })
})