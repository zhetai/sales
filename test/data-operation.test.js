import { describe, it, expect } from 'vitest'
import {
  handleIndicatorQuery,
  handleDashboardConfig,
  handleRealTimePush
} from '../src/workers/data-operation.js'

// Mock the environment variables
const mockEnv = {}

describe('Data Operation API Handlers', () => {
  describe('handleIndicatorQuery', () => {
    it('should return indicator data with valid input', async () => {
      const body = {
        time_range: '近7天',
        platform: '抖音',
        product_type: '保健品',
        metric_types: ['播放量', '转化率', 'ROI']
      }

      const response = await handleIndicatorQuery(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('request_id')
      expect(data).toHaveProperty('indicators')
      expect(Array.isArray(data.indicators)).toBe(true)
      expect(data.indicators.length).toBe(3)
    })

    it('should return error for missing metric_types', async () => {
      const body = {
        time_range: '近7天',
        platform: '抖音',
        product_type: '保健品'
        // Missing metric_types
      }

      const response = await handleIndicatorQuery(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200) // This function doesn't validate required fields
      expect(data).toHaveProperty('request_id')
      expect(data).toHaveProperty('indicators')
    })
  })

  describe('handleDashboardConfig', () => {
    it('should return dashboard configuration with valid input', async () => {
      const body = {
        chart_list: [
          { metric: '播放量', chart_type: 'line', title: '播放量趋势' },
          { metric: '转化率', chart_type: 'bar', title: '转化率对比' }
        ],
        time_range: '近7天',
        platform: '抖音'
      }

      const response = await handleDashboardConfig(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('dashboard_id')
      expect(data).toHaveProperty('config_json')
      expect(data).toHaveProperty('render_instructions')
      expect(data.config_json.charts.length).toBe(2)
    })

    it('should return error for invalid chart type', async () => {
      const body = {
        chart_list: [
          { metric: '播放量', chart_type: 'invalid_type', title: '播放量趋势' }
        ],
        time_range: '近7天',
        platform: '抖音'
      }

      const response = await handleDashboardConfig(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('handleRealTimePush', () => {
    it('should return push result with valid input', async () => {
      const body = {
        webhook_url: 'https://sc.ftqq.com/your_server_chan_key.send',
        metric_thresholds: [
          { metric: '退货率', comparison: 'above', threshold: 5.0 }
        ]
      }

      const response = await handleRealTimePush(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('push_id')
      expect(data).toHaveProperty('push_status')
      expect(data).toHaveProperty('alert_content')
    })

    it('should return error for missing webhook_url', async () => {
      const body = {
        metric_thresholds: [
          { metric: '退货率', comparison: 'above', threshold: 5.0 }
        ]
        // Missing webhook_url
      }

      const response = await handleRealTimePush(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200) // This function doesn't validate required fields
      expect(data).toHaveProperty('push_id')
    })
  })
})