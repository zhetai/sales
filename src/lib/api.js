// API测试示例

// 1. 指标查询测试
const testIndicatorQuery = async () => {
  const response = await fetch('/api/operation_indicator_query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      time_range: '近7天',
      platform: '抖音',
      product_type: '保健品',
      metric_types: ['播放量', '转化率', 'ROI', '退货率', '客单价', '复购率']
    })
  });
  
  const data = await response.json();
  console.log('指标查询结果:', data);
};

// 2. 仪表盘配置生成测试
const testDashboardConfig = async () => {
  const response = await fetch('/api/dashboard_config_generator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chart_list: [
        { metric: '播放量', chart_type: 'line', title: '播放量趋势' },
        { metric: '转化率', chart_type: 'bar', title: '转化率对比' }
      ],
      time_range: '近7天',
      platform: '抖音'
    })
  });
  
  const data = await response.json();
  console.log('仪表盘配置结果:', data);
};

// 3. 条款配置测试
const testTermConfiguration = async () => {
  const response = await fetch('/api/cooperation_term_configuration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      brand_id: 'brand_001',
      affiliate_id: 'affiliate_001',
      product_ids: ['product_001', 'product_002'],
      cooperation_type: '独家代理',
      terms: {
        compliance: {
          content_audit_responsibility: '品牌方负责内容审核',
          qualification_sharing: '双方共享相关资质'
        },
        payment: {
          settlement_cycle: '月结',
          commission_rate: '15%'
        }
      }
    })
  });
  
  const data = await response.json();
  console.log('条款配置结果:', data);
};

// 4. 权益与责任管理测试
const testRightsManagement = async () => {
  const response = await fetch('/api/rights_and_responsibilities_manager', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      term_id: 'term_123456789',
      party: 'brand',
      action: 'modify_term',
      details: {
        modification_content: '调整佣金比例至18%',
        reason: '市场策略调整'
      }
    })
  });
  
  const data = await response.json();
  console.log('权益与责任管理结果:', data);
};

// 5. 合作流程跟踪测试
const testProcessTracking = async () => {
  const response = await fetch('/api/cooperation_process_tracker', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      term_id: 'term_123456789',
      action: 'launch'
    })
  });
  
  const data = await response.json();
  console.log('合作流程跟踪结果:', data);
};

// 6. 数据共享测试
const testDataSharing = async () => {
  const response = await fetch('/api/data_sharing_portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      term_id: 'term_123456789',
      data_type: 'sales',
      time_range: '近7天'
    })
  });
  
  const data = await response.json();
  console.log('数据共享结果:', data);
};

// 运行所有测试
const runAllTests = async () => {
  console.log('开始API测试...');
  
  try {
    await testIndicatorQuery();
    await testDashboardConfig();
    await testTermConfiguration();
    await testRightsManagement();
    await testProcessTracking();
    await testDataSharing();
    
    console.log('所有API测试完成！');
  } catch (error) {
    console.error('API测试出错:', error);
  }
};

// 导出测试函数
export {
  testIndicatorQuery,
  testDashboardConfig,
  testTermConfiguration,
  testRightsManagement,
  testProcessTracking,
  testDataSharing,
  runAllTests
};