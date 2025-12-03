import { describe, it, expect, vi } from 'vitest'
import {
  handleScriptGenerationRequest,
  handleSelectionStrategyRequest
} from '../src/workers/utils.js'

// Mock the environment variables
const mockEnv = {
  BQYUN_API_KEY: 'test_bqyun_key',
  CHANMAMA_API_KEY: 'test_chanmama_key',
  DEEPSEEK_API_KEY: 'test_deepseek_key',
  TENCENT_CLOUD_API_KEY: 'test_tencent_key'
}

// Mock global functions that are used in the handlers
global.applySelectionStrategy = vi.fn().mockImplementation((opinionData, salesData) => {
  return [
    {
      product_name: "Test Product",
      舆情评分: "90分（负面率2.0%）",
      数据表现: "转化率4.0%、退货率3.0%、复购率12%",
      利润空间: "佣金35%，售价99元/盒，毛利润≈34.65元"
    }
  ]
})

// Mock fetch globally
global.fetch = vi.fn()

describe('Utils API Handlers', () => {
  describe('handleSelectionStrategyRequest', () => {
    it('should return selection strategy with valid input', async () => {
      const request = new Request('http://localhost/api/drug-selection-strategy', {
        method: 'GET'
      });

      const response = await handleSelectionStrategyRequest(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('api_name');
      expect(data).toHaveProperty('config');
      expect(data).toHaveProperty('example_output');
      expect(data.example_output).toHaveProperty('selected_products');
    });
  });

  describe('handleScriptGenerationRequest', () => {
    it('should return generated script with valid input', async () => {
      const body = {
        product_name: 'Test Product',
        product_type: '保健品',
        core_selling_point: '改善睡眠质量'
      };

      const response = await handleScriptGenerationRequest(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('request_id')
      expect(data).toHaveProperty('generated_script')
      expect(data).toHaveProperty('compliance_check')
      expect(data).toHaveProperty('optimization_suggestions')
      expect(typeof data.generated_script).toBe('string')
    })

    it('should return error for missing product_name', async () => {
      const body = {
        product_type: '保健品',
        core_selling_point: '改善睡眠质量'
        // Missing product_name
      };

      const response = await handleScriptGenerationRequest(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return error for invalid product_type', async () => {
      const body = {
        product_name: 'Test Product',
        product_type: 'invalid_type',
        core_selling_point: '改善睡眠质量'
      };

      const response = await handleScriptGenerationRequest(body, mockEnv)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })
})