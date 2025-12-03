import { describe, it, expect, vi } from 'vitest'
import {
  handleChanmamaAdPlacement,
  handleJietiaoSmartClipping,
  handleInfluencerRecommendation,
  handlePublishScheduleWebhook
} from '../src/workers/traffic-operation.js'

// Mock the environment variables
const mockEnv = {
  INFLUENCER_DB_URL: 'https://api.example.com/influencers',
  INFLUENCER_API_KEY: 'test_key'
}

// Mock fetch globally
global.fetch = vi.fn()

describe('Traffic Operation API Handlers', () => {
  describe('handleChanmamaAdPlacement', () => {
    it('should return ad placement plan with valid input', async () => {
      const body = {
        product_id: 'test_product',
        budget: 10000,
        target_audience: '熬夜党/酒局党',
        platform: '抖音'
      }

      const response = await handleChanmamaAdPlacement(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('ad_plan_id')
      expect(data).toHaveProperty('roi_prediction')
      expect(data).toHaveProperty('targeting_settings')
      expect(data).toHaveProperty('budget_allocation')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        budget: 10000,
        target_audience: '熬夜党/酒局党',
        platform: '抖音'
      }

      const response = await handleChanmamaAdPlacement(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handleJietiaoSmartClipping', () => {
    it('should return processed videos with valid input', async () => {
      const body = {
        video_url: 'https://oss.aliyuncs.com/raw_video.mp4',
        product_type: '保健品',
        target_duration: 30
      }

      const response = await handleJietiaoSmartClipping(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('processed_videos')
      expect(data).toHaveProperty('wasm_status')
      expect(Array.isArray(data.processed_videos)).toBe(true)
    })

    it('should return error for missing required fields', async () => {
      const body = {
        product_type: '保健品',
        target_duration: 30
      }

      const response = await handleJietiaoSmartClipping(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handleInfluencerRecommendation', () => {
    it('should return influencer recommendations with valid input', async () => {
      const body = {
        product_type: '保健品',
        target_platform: '抖音',
        budget_range: '中（5000-2万）'
      }

      const response = await handleInfluencerRecommendation(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('influencers')
      expect(Array.isArray(data.influencers)).toBe(true)
    })

    it('should return error for missing required fields', async () => {
      const body = {
        product_type: '保健品',
        target_platform: '抖音'
      }

      const response = await handleInfluencerRecommendation(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handlePublishScheduleWebhook', () => {
    it('should return scheduled publish result with valid input', async () => {
      const body = {
        platform: '抖音',
        publish_time: '2023-12-01T10:00:00Z',
        main_account_id: 'main_123',
        sub_account_ids: ['sub_1', 'sub_2'],
        webhook_url: 'https://webhook.example.com'
      }

      const response = await handlePublishScheduleWebhook(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('schedule_id')
      expect(data).toHaveProperty('publish_status')
      expect(data).toHaveProperty('webhook_status')
    })

    it('should return error for missing required fields', async () => {
      const body = {
        platform: '抖音',
        publish_time: '2023-12-01T10:00:00Z',
        main_account_id: 'main_123'
      }

      const response = await handlePublishScheduleWebhook(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
})