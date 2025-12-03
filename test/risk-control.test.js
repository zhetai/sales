import { describe, it, expect, vi } from 'vitest'
import {
  handleContentAudit,
  handlePharmacistTransfer,
  handleWechatNotification,
  handleReturnReview
} from '../src/workers/risk-control.js'

// Mock the environment variables
const mockEnv = {}

describe('Risk Control API Handlers', () => {
  describe('handleContentAudit', () => {
    it('should return audit result with valid input', async () => {
      const body = {
        content_type: 'video_script',
        content: 'Test content for audit',
        product_id: 'test_product'
      }

      const response = await handleContentAudit(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('audit_id')
      expect(data).toHaveProperty('audit_result')
      expect(data).toHaveProperty('violation_details')
      expect(data).toHaveProperty('risk_level')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        content_type: 'video_script'
        // Missing content and product_id
      }

      const response = await handleContentAudit(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return error for invalid content_type', async () => {
      const body = {
        content_type: 'invalid_type',
        content: 'Test content for audit',
        product_id: 'test_product'
      }

      const response = await handleContentAudit(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handlePharmacistTransfer', () => {
    it('should return transfer result with valid input', async () => {
      const body = {
        user_question: 'Test question about medication',
        product_id: 'test_product',
        user_info: {
          age: 30,
          gender: 'male'
        }
      }

      const response = await handlePharmacistTransfer(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('transfer_id')
      expect(data).toHaveProperty('transfer_status')
      expect(data).toHaveProperty('pharmacist_reply')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        user_question: 'Test question about medication'
        // Missing user_info
      }

      const response = await handlePharmacistTransfer(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handleWechatNotification', () => {
    it('should return notification result with valid input', async () => {
      const body = {
        report_info: {
          product_id: 'test_product',
          status: 'registered'
        },
        webhook_url: 'https://sc.ftqq.com/your_server_chan_key.send'
      }

      const response = await handleWechatNotification(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('notification_id')
      expect(data).toHaveProperty('notification_status')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        report_info: {
          product_id: 'test_product',
          status: 'registered'
        }
        // Missing webhook_url
      }

      const response = await handleWechatNotification(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handleReturnReview', () => {
    it('should return review result with valid input', async () => {
      const body = {
        return_request: {
          reason: 'Product damaged',
          description: 'Package was damaged during shipping'
        },
        product_info: {
            product_id: 'test_product',
            name: 'Test Product'
          },
          order_info: {
            order_id: 'order_123',
            purchase_date: '2023-01-01'
          }
      }

      const response = await handleReturnReview(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('review_id')
      expect(data).toHaveProperty('review_result')
      expect(data).toHaveProperty('action_taken')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        return_request: {
          reason: 'Product damaged',
          description: 'Package was damaged during shipping'
        }
        // Missing product_info and order_info
      }

      const response = await handleReturnReview(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
})