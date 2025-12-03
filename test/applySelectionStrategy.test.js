import { describe, it, expect } from 'vitest'

// 选品策略应用函数
function applySelectionStrategy(opinionData, salesData) {
  // 合并舆情数据和销售数据
  const combinedData = [];
  
  // 以销售数据为主表，关联舆情数据
  for (const product of salesData) {
    const opinion = opinionData.find(item => item.product_id === product.product_id);
    
    // 如果找到了对应的舆情数据，则合并
    if (opinion) {
      combinedData.push({
        product_id: product.product_id,
        product_name: product.product_name,
        舆情评分: `${opinion.sentiment_score}分（负面率${opinion.negative_rate}%）`,
        数据表现: `转化率${product.conversion_rate}%、退货率${product.return_rate}%、复购率${product.repurch_rate}%`,
        利润空间: `佣金${product.commission_rate}%，售价${product.price}元/盒，毛利润≈${(product.price * product.commission_rate / 100).toFixed(2)}元`,
        // 添加详细数据用于排序
        sentiment_score: opinion.sentiment_score,
        conversion_rate: product.conversion_rate,
        return_rate: product.return_rate,
        repurch_rate: product.repurch_rate
      });
    }
  }
  
  // 应用选品策略过滤
  const filteredData = combinedData.filter(product => {
    // 1. 舆情负面率低：负面率 < 5%
    const negativeRate = parseFloat(product.舆情评分.match(/负面率([\d.]+)%/)?.[1] || "0");
    
    // 2. 数据指标达标
    const conversionRate = product.conversion_rate;
    const returnRate = product.return_rate;
    const repurchRate = product.repurch_rate;
    
    // 3. 利润空间充足：佣金 >= 30%
    const commissionRate = parseFloat(product.利润空间.match(/佣金([\d.]+)%/)?.[1] || "0");
    
    return (
      negativeRate < 5 &&  // 负面率 < 5%
      conversionRate > 3 &&  // 转化率 > 3%
      returnRate < 5 &&  // 退货率 < 5%
      repurchRate > 10 &&  // 复购率 > 10%
      commissionRate >= 30  // 佣金 >= 30%
    );
  });
  
  // 按综合评分排序（舆情评分*0.4 + 转化率*0.3 + 复购率*0.2 + (100-退货率)*0.1）
  filteredData.sort((a, b) => {
    const scoreA = a.sentiment_score * 0.4 + a.conversion_rate * 0.3 + a.repurch_rate * 0.2 + (100 - a.return_rate) * 0.1;
    const scoreB = b.sentiment_score * 0.4 + b.conversion_rate * 0.3 + b.repurch_rate * 0.2 + (100 - b.return_rate) * 0.1;
    return scoreB - scoreA;  // 降序排列
  });
  
  // 只返回前10个产品
  return filteredData.slice(0, 10);
}

// 导出函数以便测试
export { applySelectionStrategy }

describe('applySelectionStrategy', () => {
  it('should filter and sort products based on selection strategy', () => {
    const opinionData = [
      {
        product_id: 'product_001',
        sentiment_score: 90,
        negative_rate: 2.0
      },
      {
        product_id: 'product_002',
        sentiment_score: 85,
        negative_rate: 3.0
      },
      {
        product_id: 'product_003',
        sentiment_score: 95,
        negative_rate: 1.0
      }
    ]

    const salesData = [
      {
        product_id: 'product_001',
        product_name: 'Product 1',
        conversion_rate: 4.5,
        return_rate: 3.0,
        repurch_rate: 15,
        commission_rate: 35,
        price: 100
      },
      {
        product_id: 'product_002',
        product_name: 'Product 2',
        conversion_rate: 2.0,
        return_rate: 3.0,
        repurch_rate: 15,
        commission_rate: 35,
        price: 100
      },
      {
        product_id: 'product_003',
        product_name: 'Product 3',
        conversion_rate: 4.5,
        return_rate: 3.0,
        repurch_rate: 15,
        commission_rate: 25,
        price: 100
      }
    ]

    const result = applySelectionStrategy(opinionData, salesData)

    // 验证结果
    expect(result).toHaveLength(1) // 只有一个产品符合所有条件
    expect(result[0].product_id).toBe('product_001') // 符合条件的产品
  })

  it('should return empty array when no products meet criteria', () => {
    const opinionData = [
      {
        product_id: 'product_001',
        sentiment_score: 50,
        negative_rate: 10.0
      }
    ]

    const salesData = [
      {
        product_id: 'product_001',
        product_name: 'Product 1',
        conversion_rate: 1.0,
        return_rate: 10.0,
        repurch_rate: 5,
        commission_rate: 20,
        price: 100
      }
    ]

    const result = applySelectionStrategy(opinionData, salesData)

    // 验证结果
    expect(result).toHaveLength(0) // 没有产品符合所有条件
  })

  it('should handle empty input arrays', () => {
    const result = applySelectionStrategy([], [])

    // 验证结果
    expect(result).toHaveLength(0)
  })

  it('should handle mismatched product data', () => {
    const opinionData = [
      {
        product_id: 'product_001',
        sentiment_score: 90,
        negative_rate: 2.0
      }
    ]

    const salesData = [
      {
        product_id: 'product_002', // 不匹配的ID
        product_name: 'Product 2',
        conversion_rate: 4.5,
        return_rate: 3.0,
        repurch_rate: 15,
        commission_rate: 35,
        price: 100
      }
    ]

    const result = applySelectionStrategy(opinionData, salesData)

    // 验证结果
    expect(result).toHaveLength(0) // 没有匹配的产品
  })
})