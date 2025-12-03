/**
 * Data Operation Module
 * Handles comprehensive data-driven operation metrics for pharmaceutical distribution partnerships
 * 
 * This module includes functions for:
 * - Multi-dimensional operation indicator query
 * - Visualization dashboard configuration generation
 * - Real-time indicator push with anomaly detection
 * 
 * @module data-operation
 */

import { Logger, ErrorTracker } from './logging.js';

// 创建一个logger实例
const logger = new Logger(20, 'data-operation'); // 20 is INFO level

/**
 * 药品代销数据化运营指标综合API处理函数
 * 
 * @param {Request} request - The incoming request
 * @param {Object} env - The environment variables
 * @returns {Response} - The response to the request
 */
export async function handleDataOperationRequest(request, env) {
  // 记录API调用
  logger.info('Handling data operation request', {
    requestId: crypto.randomUUID(),
    url: request.url
  });
  
  // 检查请求方法
  if (request.method !== 'POST') {
    logger.warn('Invalid method', {
      method: request.method,
      allowed: ['POST']
    });
    
    return new Response(JSON.stringify({ 
      error: 'Method not allowed', 
      allowed_methods: ['POST'],
      received_method: request.method
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 检查内容类型
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('Invalid content type', {
      received: contentType,
      expected: 'application/json'
    });
    
    return new Response(JSON.stringify({ 
      error: 'Unsupported content type', 
      expected: 'application/json',
      received: contentType
    }), { 
      status: 406,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    logger.error('Invalid JSON body', {
      error: error.message
    });
    
    return new Response(JSON.stringify({ 
      error: 'Invalid JSON body', 
      details: error.message
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const module = body.module_name;
  
  // 添加调试日志
  logger.debug('Received module name', {
    module: module,
    body: body
  });

  switch(module) {
    case 'operation_indicator_query':
      return await ErrorTracker.wrap(handleIndicatorQuery, { module: 'operation_indicator_query' })(body, env);
    case 'dashboard_config_generator':
      return await ErrorTracker.wrap(handleDashboardConfig, { module: 'dashboard_config_generator' })(body, env);
    case 'real_time_indicator_push':
      return await ErrorTracker.wrap(handleRealTimePush, { module: 'real_time_indicator_push' })(body, env);
    default:
      logger.warn('Invalid module name', {
        module: module
      });
      
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// 指标查询处理函数
export async function handleIndicatorQuery(body, env) {
  const { time_range, platform, product_type, metric_types, drill_down } = body;
  
  // 权限校验：根据用户角色过滤可访问的指标（如客服仅能查看自己负责的商品）
  // 这里简化处理，实际应调用权限系统接口
  
  // 数据聚合：从数据仓库（如ClickHouse）拉取对应时间范围、平台的指标数据
  // 这里使用模拟数据
  const allIndicators = {
    "播放量": { value: 120000, unit: "次", trend: "↑15%（较昨日）" },
    "转化率": { value: 3.8, unit: "%", trend: "→持平" },
    "ROI": { value: 1.28, unit: "", trend: "↑8%（较上周）" },
    "退货率": { value: 4.2, unit: "%", trend: "↓5%（较上周）" },
    "客单价": { value: 89.5, unit: "元", trend: "→持平" },
    "复购率": { value: 12.3, unit: "%", trend: "↑3%（较上月）" }
  };
  
  // 根据请求的指标类型过滤数据
  const indicators = (metric_types || []).map(metric => ({
    metric_name: metric,
    ...allIndicators[metric]
  }));
  
  // 下钻处理：若有钻取参数，补充单品/达人的明细指标
  if (drill_down && drill_down.product_id) {
    indicators.forEach(indicator => {
      if (indicator.metric_name === "播放量") {
        indicator.drill_down_data = { product_id: drill_down.product_id, play_count: 80000 };
      } else if (indicator.metric_name === "转化率") {
        indicator.drill_down_data = { product_id: drill_down.product_id, conversion_rate: 4.2 };
      } else if (indicator.metric_name === "退货率") {
        indicator.drill_down_data = { product_id: drill_down.product_id, return_rate: 3.8 };
      }
    });
  }
  
  // 结果格式化：将原始数据转换为可视化友好的结构
  const result = {
    request_id: `req_${Date.now()}`,
    indicators: indicators,
    dashboard_config_hint: { recommended_charts: ["折线图（播放量趋势）", "柱状图（商品转化率对比）"] }
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' } });
}

// 仪表盘配置生成处理函数
export async function handleDashboardConfig(body, env) {
  const { chart_list, time_range, platform } = body;
  
  // 图表合法性校验：检查chart_type与metric的匹配性
  const validChartTypes = {
    "播放量": ["line", "bar"],
    "转化率": ["line", "bar"],
    "ROI": ["line", "bar"],
    "退货率": ["line", "bar"],
    "客单价": ["line", "bar"],
    "复购率": ["line", "bar"],
    "流量占比": ["pie"]
  };
  
  const invalidCharts = chart_list.filter(chart => 
    validChartTypes[chart.metric] && !validChartTypes[chart.metric].includes(chart.chart_type)
  );
  
  if (invalidCharts.length > 0) {
    return new Response(JSON.stringify({ 
      error: `图表类型与指标不匹配: ${invalidCharts.map(c => c.metric).join(', ')}` 
    }), { status: 400, headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' } });
  }
  
  // 布局优化：根据图表数量自动调整布局
  // 数据源绑定：关联指标查询API，确保图表数据实时更新
  // 交互配置：添加默认筛选器与钻取功能
  
  // 这里使用模拟数据生成仪表盘配置
  const config = {
    title: `药品代销${platform}运营仪表盘（${time_range}）`,
    charts: chart_list.map((chart, index) => {
      if (chart.chart_type === "pie") {
        return {
          id: `chart${index + 1}`,
          type: chart.chart_type,
          data: {
            categories: ["抖音", "视频号", "其他"],
            series: [{
              name: chart.metric,
              data: [60, 30, 10]
            }]
          },
          options: {
            title: chart.title
          }
        };
      } else {
        return {
          id: `chart${index + 1}`,
          type: chart.chart_type,
          data: {
            xAxis: ["5/14", "5/15", "5/16", "5/17", "5/18", "5/19", "5/20"],
            series: [{
              name: chart.metric,
              data: [100000, 110000, 120000, 115000, 125000, 130000, 140000]
            }]
          },
          options: {
            xAxisName: chart.dimension || "日期",
            yAxisName: chart.metric,
            title: chart.title
          }
        };
      }
    })
  };
  
  // 布局优化
  let layout = "1列布局";
  if (chart_list.length >= 2) {
    layout = "2列网格";
  }
  if (chart_list.length >= 4) {
    layout = "4象限布局";
  }
  
  const result = {
    dashboard_id: `dash_${Date.now()}`,
    config_json: config,
    render_instructions: `使用ECharts渲染，布局为${layout}，顶部添加时间筛选器`
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' } });
}

// 实时指标推送处理函数
export async function handleRealTimePush(body, env) {
  const { webhook_url, metric_thresholds } = body;
  
  // 阈值监控：定时查询指标数据，对比预设阈值
  // 异常检测：若指标触发阈值，生成告警内容
  // 推送通知：调用Webhook接口发送告警
  // 状态回执：记录推送结果
  
  // 这里模拟一个异常情况
  let alertContent = "";
  let hasAlert = false;
  
  // 模拟检查指标
  const currentMetrics = {
    "退货率": 6.2,
    "ROI": 1.2
  };
  
  metric_thresholds.forEach(threshold => {
    const currentValue = currentMetrics[threshold.metric];
    if (currentValue !== undefined) {
      if (threshold.comparison === "above" && currentValue > threshold.threshold) {
        alertContent = `【异常预警】${threshold.metric}升至${currentValue}%（阈值${threshold.threshold}%），较昨日+120%。推测原因：部分用户反馈肠胃不适，建议转接药师核实。`;
        hasAlert = true;
      } else if (threshold.comparison === "below" && currentValue < threshold.threshold) {
        alertContent = `【异常预警】${threshold.metric}降至${currentValue}（阈值${threshold.threshold}），较昨日-20%。推测原因：可能受市场环境影响，建议关注竞品动态。`;
        hasAlert = true;
      }
    }
  });
  
  if (!hasAlert) {
    alertContent = "【指标正常】所有监控指标均在正常范围内";
  }
  
  let pushStatus = "sent";
  let failureReason = "";
  
  try {
    // 这里应该调用实际的Webhook API
    // await fetch(webhook_url, { method: 'POST', body: JSON.stringify({ text: alertContent }) });
  } catch (error) {
    pushStatus = "failed";
    failureReason = "Webhook URL失效";
  }
  
  const result = {
    push_id: `push_${Date.now()}`,
    push_status: pushStatus,
    alert_content: alertContent,
    failure_reason: failureReason
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' } });
}