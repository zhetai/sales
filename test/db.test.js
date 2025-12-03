import { describe, it, expect, vi } from 'vitest'
import { 
  initDatabase,
  createCooperationTerm,
  getCooperationTerm,
  getCooperationTermsByBrand,
  getCooperationTermsByAffiliate,
  createRightsHistory,
  createCooperationProcess,
  updateCooperationProcess,
  getCooperationProcess,
  createDataSharingRecord,
  createInfluencerRecommendation,
  createProductSelectionStrategy,
  createUser,
  getUserByUsername
} from '../src/workers/db.js'

// Mock D1 database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({}),
  first: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue({ results: [] })
}

describe('Database Functions', () => {
  describe('initDatabase', () => {
    it('should initialize the database', async () => {
      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: [] })
      })
      
      await expect(initDatabase(mockDb)).resolves.toBeUndefined()
    })
  })

  describe('createCooperationTerm', () => {
    it('should create a cooperation term', async () => {
      const term = {
        brand_id: 'brand_001',
        affiliate_id: 'affiliate_001',
        product_ids: ['product_001', 'product_002'],
        cooperation_type: '独家代理',
        terms: {
          compliance: {
            content_audit_responsibility: '品牌方负责内容审核',
            qualification_sharing: '双方共享相关资质'
          }
        }
      }

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      })

      const result = await createCooperationTerm(mockDb, term)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.brand_id).toBe(term.brand_id)
    })
  })

  describe('getCooperationTerm', () => {
    it('should get a cooperation term by ID', async () => {
      const term = {
        id: 'term_123',
        brand_id: 'brand_001',
        affiliate_id: 'affiliate_001',
        product_ids: '["product_001", "product_002"]',
        cooperation_type: '独家代理',
        terms: '{"compliance": {"content_audit_responsibility": "品牌方负责内容审核"}}'
      }

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(term)
      })

      const result = await getCooperationTerm(mockDb, 'term_123')
      expect(result).toBeDefined()
      expect(result.id).toBe(term.id)
    })
  })

  describe('createUser', () => {
    it('should create a user', async () => {
      const user = {
        username: 'testuser',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456', // Valid bcrypt hash format for testing
        role: 'admin'
      }

      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      })

      const result = await createUser(mockDb, user)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.username).toBe(user.username)
    })
  })
})