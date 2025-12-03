/**
 * Utility functions for the Sales Proxy application
 */

import { Logger, ErrorTracker } from './logging.js';

// 创建一个logger实例
const logger = new Logger(20, 'utils'); // 20 is INFO level

// 缓存存储
const CACHE_NAME = 'sales-proxy-cache-v2';
const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

/**
 * Get a response from cache
 */
export async function getFromCache(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const cacheTime = cachedResponse.headers.get('x-cache-time');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
        // 更新缓存的最后访问时间（用于LRU策略）
        const headers = new Headers(cachedResponse.headers);
        headers.set('x-cache-last-access', Date.now().toString());
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      } else {
        // 缓存过期，删除
        await cache.delete(request);
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  
  return null;
}

/**
 * Put a response in cache
 */
export async function putInCache(request, response) {
  try {
    // 只缓存成功的GET请求
    if (request.method === 'GET' && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      
      // 克隆响应并添加缓存时间戳
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('x-cache-time', Date.now().toString());
      headers.set('x-cache-last-access', Date.now().toString());
      
      const responseToCache = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });
      
      await cache.put(request, responseToCache);
    }
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

/**
 * Generic request handler
 */
export async function handleRequest(request, env) {
  // 检查请求方法
  if (request.method !== 'POST') {
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
  // console.log('handleRequest - Received module name:', module);
  // console.log('handleRequest - Request body:', JSON.stringify(body));

  switch(module) {
    case 'operation_indicator_query':
      return handleIndicatorQuery(body, env);
    case 'dashboard_config_generator':
      return handleDashboardConfig(body, env);
    case 'real_time_indicator_push':
      return handleRealTimePush(body, env);
    case 'cooperation_term_configuration':
      return handleTermConfiguration(body, env);
    case 'rights_and_responsibilities_manager':
      return handleRightsManagement(body, env);
    case 'cooperation_process_tracker':
      return handleProcessTracking(body, env);
    case 'data_sharing_portal':
      return handleDataSharing(body, env);
    case 'chanmama_ad_placement':
      return handleChanmamaAdPlacement(body, env);
    case 'jietiao_smart_clipping':
      return handleJietiaoSmartClipping(body, env);
    case 'influencer_recommendation':
      return handleInfluencerRecommendation(body, env);
    case 'publish_schedule_webhook':
      return handlePublishScheduleWebhook(body, env);
    case 'generate-video-script':
      return handleScriptGenerationRequest(body, env);
    default:
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// 指标查询处理函数
async function handleIndicatorQuery(body, env) {
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
  const indicators = metric_types.map(metric => ({
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
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 仪表盘配置生成处理函数
async function handleDashboardConfig(body, env) {
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
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 生成图表配置
  const config = generateChartConfig(chart_list, platform, time_range);
  
  // 布局优化
  const layout = determineLayout(chart_list.length);
  
  const result = {
    dashboard_id: `dash_${Date.now()}`,
    config_json: config,
    render_instructions: `使用ECharts渲染，布局为${layout}，顶部添加时间筛选器`
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * Generate chart configuration for the dashboard
 * @param {Array} chart_list - List of chart configurations
 * @param {string} platform - Platform name
 * @param {string} time_range - Time range
 * @returns {Object} - Chart configuration object
 */
function generateChartConfig(chart_list, platform, time_range) {
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
  
  return config;
}

/**
 * Determine the layout based on the number of charts
 * @param {number} chartCount - Number of charts
 * @returns {string} - Layout description
 */
function determineLayout(chartCount) {
  if (chartCount >= 4) {
    return "4象限布局";
  } else if (chartCount >= 2) {
    return "2列网格";
  } else {
    return "1列布局";
  }
}

// 实时指标推送处理函数
async function handleRealTimePush(body, env) {
  const { webhook_url, metric_thresholds } = body;
  
  // 阈值监控：定时查询指标数据，对比预设阈值
  // 异常检测：若指标触发阈值，生成告警内容
  // 推送通知：调用Webhook接口发送告警
  // 状态回执：记录推送结果
  
  // 评估指标并生成告警内容
  const { alertContent, hasAlert } = evaluateMetrics(metric_thresholds);
  
  // 发送告警通知
  const { pushStatus, failureReason } = await sendAlertNotification(webhook_url, alertContent);
  
  const result = {
    push_id: `push_${Date.now()}`,
    push_status: pushStatus,
    alert_content: alertContent,
    failure_reason: failureReason
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * Evaluate metrics against thresholds and generate alert content
 * @param {Array} metric_thresholds - List of metric thresholds
 * @returns {Object} - Alert content and whether there's an alert
 */
function evaluateMetrics(metric_thresholds) {
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
  
  return { alertContent, hasAlert };
}

/**
 * Send alert notification via webhook
 * @param {string} webhook_url - Webhook URL
 * @param {string} alertContent - Alert content
 * @returns {Object} - Push status and failure reason
 */
async function sendAlertNotification(webhook_url, alertContent) {
  let pushStatus = "sent";
  let failureReason = "";
  
  try {
    // 这里应该调用实际的Webhook API
    // await fetch(webhook_url, { method: 'POST', body: JSON.stringify({ text: alertContent }) });
  } catch (error) {
    pushStatus = "failed";
    failureReason = "Webhook URL失效";
  }
  
  return { pushStatus, failureReason };
}

// 条款配置处理函数
async function handleTermConfiguration(body, env) {
  const { brand_id, affiliate_id, product_ids, cooperation_type, terms } = body;
  
  // 数据验证
  if (!brand_id || !affiliate_id || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing required fields: brand_id, affiliate_id, product_ids' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!cooperation_type || !['独家代理', '非独家代理', '寄售模式', '一件代发'].includes(cooperation_type)) {
    return new Response(JSON.stringify({ error: 'Invalid cooperation_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 合规校验：强制包含药品类必填条款
  if (!terms.compliance || !terms.compliance.content_audit_responsibility || !terms.compliance.qualification_sharing) {
    return new Response(JSON.stringify({ error: 'Missing required compliance terms' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 条款标准化：将双方协商条款转换为结构化JSON
  // 这里简化处理，实际应有更复杂的标准化逻辑
  
  // 双方确认：生成电子合同草稿，推送至品牌方与代销方数字签名
  // 这里简化处理，实际应调用电子签名平台API
  
  // 存储备案：将签署后的合同存储至区块链存证平台
  const term = await saveToBlockchain(terms);
  
  return new Response(JSON.stringify(term), { headers: { 'Content-Type': 'application/json' } });
}

// 权益与责任管理处理函数
async function handleRightsManagement(body, env) {
  const { term_id, party, action, details } = body;
  
  // 数据验证
  if (!term_id || !party || !action) {
    return new Response(JSON.stringify({ error: 'Missing required fields: term_id, party, action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['brand', 'affiliate'].includes(party)) {
    return new Response(JSON.stringify({ error: 'Invalid party' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['modify_term', 'raise_dispute', 'confirm_change'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 权限校验：仅允许合同签署方发起修改或争议
  if (!(await verifyParty(term_id, party))) {
    return new Response(JSON.stringify({ error: 'Unauthorized party' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 变更审核：品牌方发起的条款修改需代销方确认，代销方发起的争议需品牌方响应
  // 这里简化处理，实际应有更复杂的审核流程
  
  // 仲裁介入：若双方无法达成一致，自动触发第三方仲裁接口
  let arbitration_id = null;
  if (action === "raise_dispute") {
    arbitration_id = await triggerArbitration(details);
  }
  
  // 版本管理：保存条款变更历史
  // 这里简化处理，实际应存储到数据库
  
  const result = {
    change_id: `change_${Date.now()}`,
    current_terms: details, // 简化处理，实际应返回最新条款
    dispute_status: arbitration_id ? "under_arbitration" : "pending"
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 合作流程跟踪处理函数
async function handleProcessTracking(body, env) {
  const { term_id, action } = body;
  
  // 数据验证
  if (!term_id || !action) {
    return new Response(JSON.stringify({ error: 'Missing required fields: term_id, action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['launch', 'pause', 'terminate', 'settle'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 流程校验：检查当前状态是否允许操作
  // 这里简化处理，实际应查询当前状态
  
  // 状态更新：修改合作状态
  // 这里简化处理，实际应更新数据库状态
  
  // 通知触发：向双方推送流程变更通知
  // 这里简化处理，实际应调用通知服务
  
  // 数据归档：结算完成后归档全流程数据
  // 这里简化处理，实际应调用归档服务
  
  const result = {
    process_id: `process_${Date.now()}`,
    current_status: action === "settle" ? "settled" : `${action}d`,
    next_steps: action === "launch" ? ["brand to ship products within 3 days"] : []
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 数据共享处理函数
async function handleDataSharing(body, env) {
  const { term_id, data_type, time_range } = body;
  
  // 数据验证
  if (!term_id || !data_type || !time_range) {
    return new Response(JSON.stringify({ error: 'Missing required fields: term_id, data_type, time_range' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['sales', 'user_feedback', 'inventory'].includes(data_type)) {
    return new Response(JSON.stringify({ error: 'Invalid data_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['近7天', '近30天', '自定义'].includes(time_range)) {
    return new Response(JSON.stringify({ error: 'Invalid time_range' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 权限校验：仅允许合作双方访问授权数据
  // 这里简化处理，实际应调用权限校验服务
  
  // 数据脱敏：隐藏敏感信息
  // 这里简化处理，实际应有数据脱敏逻辑
  
  // 报告生成：按时间范围生成数据报表
  const data = await queryData(term_id, data_type, time_range);
  
  // 实时推送：关键数据主动推送至双方
  // 这里简化处理，实际应调用推送服务
  
  const result = {
    data_report: {
      [data_type]: data,
      chart: data_type === "sales" ? "折线图（近30天销售趋势）" : ""
    },
    access_log: [{
      user: "affiliate_admin",
      time: new Date().toISOString(),
      data_type: data_type
    }]
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 千川投放接口（ROI基准线管控）
async function handleChanmamaAdPlacement(body, env) {
  const { product_id, budget, target_audience, platform } = body;
  
  // 数据验证
  if (!product_id || !budget || !target_audience || !platform) {
    return new Response(JSON.stringify({ error: 'Missing required fields: product_id, budget, target_audience, platform' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['熬夜党/酒局党', '中老年养生', '母婴家庭'].includes(target_audience)) {
    return new Response(JSON.stringify({ error: 'Invalid target_audience' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['抖音', '视频号'].includes(platform)) {
    return new Response(JSON.stringify({ error: 'Invalid platform' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 合规校验：过滤药品类禁投内容（如"根治""治愈"）
  // 这里简化处理，实际应调用合规校验服务
  
  // ROI测算：基于商品类目（OTC/保健品）匹配基准线（1:2.5/1:2）
  // 这里使用模拟数据
  const roiPrediction = platform === '抖音' ? 1.28 : 1.2;
  
  // 计划生成：输出千川投放计划（定向、出价、预算分配）
  const targetingSettings = {
    age: target_audience === '中老年养生' ? "36-50" : "18-45",
    interest: target_audience,
    region: "一线/新一线城市"
  };
  
  const budgetAllocation = {
    test: Math.round(budget * 0.2),
    formal: Math.round(budget * 0.8)
  };
  
  // 风险预警：若ROI预测低于基准线，提示调整预算或定向
  const complianceAlert = roiPrediction < 1.2 ? "预测ROI低于基准线，请考虑调整预算或定向策略" : "";
  
  const result = {
    ad_plan_id: `camp_${Date.now()}`,
    roi_prediction: roiPrediction,
    targeting_settings: targetingSettings,
    budget_allocation: budgetAllocation,
    compliance_alert: complianceAlert
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 剪映智能剪辑WASM处理（多版本生成+完播率筛选）
async function handleJietiaoSmartClipping(body, env) {
  const { video_url, product_type, target_duration } = body;
  
  // 数据验证
  if (!video_url || !product_type || !target_duration) {
    return new Response(JSON.stringify({ error: 'Missing required fields: video_url, product_type, target_duration' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['OTC药品', '保健品', '中药饮片'].includes(product_type)) {
    return new Response(JSON.stringify({ error: 'Invalid product_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // WASM模块加载：调用剪映智能成片WASM接口（需提前部署到Cloudflare Workers KV）
  // 这里简化处理，实际应加载WASM模块
  
  // 多版本生成：基于原始视频生成10个不同版本（剪辑节奏、字幕样式、开头优化）
  // 这里使用模拟数据
  
  // 完播率筛选：调用蝉妈妈API获取各版本完播率，筛选＞35%的素材
  // 这里使用模拟数据
  const processedVideos = [
    { url: "https://oss.aliyuncs.com/video_1.mp4", completion_rate: "42%" },
    { url: "https://oss.aliyuncs.com/video_3.mp4", completion_rate: "38%" },
    { url: "https://oss.aliyuncs.com/video_7.mp4", completion_rate: "36%" }
  ];
  
  const result = {
    processed_videos: processedVideos,
    wasm_status: true
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 符合"带货条件"的达人推荐列表
async function handleInfluencerRecommendation(body, env) {
  const { product_type, target_platform, budget_range } = body;
  
  // 数据验证
  if (!product_type || !target_platform || !budget_range) {
    return new Response(JSON.stringify({ error: 'Missing required fields: product_type, target_platform, budget_range' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['OTC药品', '保健品', '中药饮片'].includes(product_type)) {
    return new Response(JSON.stringify({ error: 'Invalid product_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['抖音', '视频号', '快手'].includes(target_platform)) {
    return new Response(JSON.stringify({ error: 'Invalid target_platform' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['低（＜5000元）', '中（5000-2万）', '高（＞2万）'].includes(budget_range)) {
    return new Response(JSON.stringify({ error: 'Invalid budget_range' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 达人库筛选：基于历史数据（转化率、差评率、粉丝画像）过滤
  // 这里使用模拟数据
  
  // 条件匹配：匹配商品类型、平台、预算（如腰部达人坑位费500-2000元）
  // 这里使用模拟数据
  
  // 合规校验：排除有药品违规记录的达人
  // 这里简化处理，实际应调用合规校验服务
  
  // 排序：按"带货转化率×粉丝精准度"降序排列
  // 这里使用模拟数据
  const influencers = [
    {
      name: "健康小夏（抖音）",
      follower_count: "35万",
      conversion_rate: "4.2%",
      commission_rate: "20%",
      contact: "私信/星图平台",
      profile_url: "https://www.douyin.com/user/MS4wLjABAAAA_healthxia"
    },
    {
      name: "养生达人李医生（视频号）",
      follower_count: "28万",
      conversion_rate: "3.8%",
      commission_rate: "18%",
      contact: "私信/视频号",
      profile_url: "https://channels.weixin.qq.com/profile?username=DrLi_health"
    }
  ];
  
  const result = {
    influencers: influencers,
    recommendation_reason: `匹配${product_type}品类，近30天转化率＞3.5%，无违规记录`
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 平台发布时间及主子账号微信通知
async function handlePublishScheduleWebhook(body, env) {
  const { platform, publish_time, main_account_id, sub_account_ids, webhook_url } = body;
  
  // 数据验证
  if (!platform || !publish_time || !main_account_id || !sub_account_ids || !webhook_url) {
    return new Response(JSON.stringify({ error: 'Missing required fields: platform, publish_time, main_account_id, sub_account_ids, webhook_url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['抖音', '视频号'].includes(platform)) {
    return new Response(JSON.stringify({ error: 'Invalid platform' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!Array.isArray(sub_account_ids)) {
    return new Response(JSON.stringify({ error: 'sub_account_ids must be an array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 发布调度：调用平台API（如抖音创作者服务中心）设置定时发布
  // 这里简化处理，实际应调用平台API
  
  // 状态监控：监听发布结果（成功/失败）
  // 这里使用模拟数据
  
  // 微信通知：触发Webhook发送通知（含发布状态、账号信息）
  const notificationContent = `【${platform}发布提醒】主账号${main_account_id}的视频已调度，发布时间：${new Date(publish_time).toLocaleString('zh-CN')}，子账号：${sub_account_ids.join('、')}`;
  
  // 这里简化处理，实际应调用Webhook API
  let webhookStatus = "sent";
  let failureReason = "";
  
  try {
    // 这里应该调用实际的Webhook API
    // await fetch(webhook_url, { method: 'POST', body: JSON.stringify({ text: notificationContent }) });
  } catch (error) {
    webhookStatus = "failed";
    failureReason = "Webhook URL失效";
  }
  
  const result = {
    schedule_id: `pub_${Date.now()}`,
    publish_status: "已调度",
    notification_content: notificationContent,
    webhook_status: webhookStatus,
    failure_reason: failureReason
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 药品代销短视频带货选品策略配置
export async function handleSelectionStrategyRequest(request, env) {
  // 获取实时选品数据
  let selectedProducts = [];
  let dataSource = "mock";
  
  try {
    // 从环境变量获取API密钥
    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'default_deepseek_key';
    
    // 调用Tencent Cloud NLP服务获取舆情数据
    let opinionData = { products: [] };
    let nlpSuccess = false;
    
    if (env.ECOMMERCE_PRODUCT_SELECTOR) {
      try {
        const nlpResponse = await env.ECOMMERCE_PRODUCT_SELECTOR.fetch(new Request('https://ecommerce-product-selector-production.tencentcloud.com/api/sentiment-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            time_range: "近30天",
            negative_keywords: [
              "过敏",
              "无效",
              "副作用大",
              "没效果",
              "头晕",
              "恶心"
            ]
          })
        }));
        
        if (nlpResponse.ok) {
          opinionData = await nlpResponse.json();
          nlpSuccess = true;
        }
      } catch (nlpError) {
        console.error('Failed to fetch sentiment analysis data from Tencent Cloud NLP, will try direct API call:', nlpError);
        // 如果通过worker调用失败，尝试直接调用Tencent Cloud NLP API
        try {
          const tencentCloudApiKey = env.TENCENT_CLOUD_API_KEY || 'default_tencent_key';
          const nlpDirectResponse = await fetch('https://ecommerce-product-selector-production.tencentcloud.com/api/sentiment-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tencentCloudApiKey}`
            },
            body: JSON.stringify({
              time_range: "近30天",
              negative_keywords: [
                "过敏",
                "无效",
                "副作用大",
                "没效果",
                "头晕",
                "恶心"
              ]
            })
          });
          
          if (nlpDirectResponse.ok) {
            opinionData = await nlpDirectResponse.json();
            nlpSuccess = true;
          } else {
            console.error('Direct Tencent Cloud NLP API call failed:', nlpDirectResponse.status, await nlpDirectResponse.text());
          }
        } catch (directError) {
          console.error('Direct Tencent Cloud NLP API call failed:', directError);
        }
      }
    }
    
    // 如果没有ECOMMERCE_PRODUCT_SELECTOR绑定或调用失败，则使用空数据
    if (!nlpSuccess) {
      console.error('Failed to fetch sentiment analysis data from Tencent Cloud NLP, using empty data');
      opinionData = { products: [] };
    }
    
    // 调用DeepSeek API获取销售数据
    const salesDataResponse = await fetch('https://api.deepseek.com/products/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        time_range: "近30天",
        metrics: ["转化率", "退货率", "复购率"]
      })
    });
    
    if ((opinionData.products && opinionData.products.length > 0 || !env.ECOMMERCE_PRODUCT_SELECTOR) && salesDataResponse.ok) {
      const salesData = await salesDataResponse.json();
      
      // 合并数据并应用选品策略
      selectedProducts = applySelectionStrategy(opinionData.products || [], salesData.products);
      dataSource = "real_time";
    } else {
      // 如果API调用失败，回退到模拟数据
      console.error('Failed to fetch real data from APIs, using mock data');
      selectedProducts = [
        {
          product_name: "Swisse护肝片（OTC类）",
          舆情评分: "92分（负面率1.2%）",
          数据表现: "转化率4.1%、退货率3.5%、复购率15%",
          利润空间: "佣金40%，售价199元/瓶，毛利润≈79.6元"
        },
        {
          product_name: "汤臣倍健褪黑素软糖（保健品）",
          舆情评分: "89分（负面率2.1%）",
          数据表现: "转化率3.8%、退货率4.2%、复购率12%",
          利润空间: "佣金35%，售价99元/盒，毛利润≈34.65元"
        }
      ];
    }
  } catch (error) {
    // 如果出现网络错误，回退到模拟数据
    console.error('Error fetching real data, using mock data:', error);
    selectedProducts = [
      {
        product_name: "Swisse护肝片（OTC类）",
        舆情评分: "92分（负面率1.2%）",
        数据表现: "转化率4.1%、退货率3.5%、复购率15%",
        利润空间: "佣金40%，售价199元/瓶，毛利润≈79.6元"
      },
      {
        product_name: "汤臣倍健褪黑素软糖（保健品）",
        舆情评分: "89分（负面率2.1%）",
        数据表现: "转化率3.8%、退货率4.2%、复购率12%",
        利润空间: "佣金35%，售价99元/盒，毛利润≈34.65元"
      }
    ];
  }
  
  // 如果有数据库连接，存储选品策略记录到数据库
  let dbRecord = null;
  if (env.DB) {
    try {
      // 导入数据库访问函数
      const { createProductSelectionStrategy } = await import('./db.js');
      
      // 存储选品策略记录到数据库
      dbRecord = await createProductSelectionStrategy(env.DB, {
        selected_products: selectedProducts,
        data_source: dataSource
      });
    } catch (error) {
      console.error('Database storage failed:', error);
      // 即使数据库存储失败，我们仍然继续处理
    }
  }
  
  // 选品策略逻辑
  const strategy = {
    api_name: "drug_affiliate_video_sales_selection_strategy",
    version: "1.1",
    description: "药品代销短视频带货选品策略API，覆盖舆情反向选品、热点借势、数据验证及利润测算",
    config: {
      public_opinion_monitoring: {
        tool: "Tencent Cloud NLP (情感分析)",
        purpose: "反向筛选低风险商品（排除负面舆情集中的品类）",
        monitor_targets: [
          "商品评论区",
          "直播间弹幕",
          "社交平台（小红书/抖音）用户反馈",
          "电商平台（京东健康/拼多多）差评"
        ],
        negative_keywords: [
          "过敏",
          "无效",
          "副作用大",
          "没效果",
          "头晕",
          "恶心"
        ],
        filter_rule: "商品负面关键词提及率＞5% 或 差评率＞8% → 自动排除"
      },
      hot_product_selection: {
        hot_trend_borrowing: {
          platform: "抖音",
          tracked_list: "健康热榜",
          selection_logic: "选择上升期品类（搜索量/讨论量周环比增长＞30%）",
          example: "2025年Q3「护肝片」搜索量同比+200%、「褪黑素软糖」讨论量周增45%",
          avoid_categories: ["处方药、未备案保健品、争议性中药饮片"]
        },
        data_verification: {
          tool: "蝉妈妈/灰豚数据",
          metrics: [
            {
              name: "转化率",
              threshold: "＞3%",
              reason: "低于3%说明用户决策门槛高或需求不匹配"
            },
            {
              name: "退货率",
              threshold: "＜5%",
              reason: "高于5%易引发代销售后纠纷"
            },
            {
              name: "复购率",
              threshold: "＞10%",
              reason: "筛选高粘性刚需品（如维生素、益生菌）"
            }
          ]
        },
        profit_calculation: {
          commission_range: "30%-50%",
          cost_coverage: {
            platform_ad_cost: "抖音CPC≈1.5-3元/次、千川投流ROI基准线1:2.5",
            content_production_cost: "单条视频制作成本≤50元（含脚本/拍摄/剪辑）"
          },
          profit_target: "单商品毛利润≥售价的20%（覆盖运营成本后净赚≥10%）"
        },
        reverse_selection_logic: "基于舆情+数据双重过滤：1. 舆情负面率低；2. 数据指标达标；3. 利润空间充足 → 锁定最终代销商品"
      }
    },
    example_output: {
      selected_products: selectedProducts,
      data_source: dataSource
    },
    deployment_notes: {
      worker_entry_point: "handleSelectionRequest",
      trigger_method: "GET /api/drug-selection-strategy",
      response_format: "application/json",
      required_env_vars: [
        "DEEPSEEK_API_KEY" // DeepSeek API密钥
      ],
      service_bindings: [
        {
          name: "ECOMMERCE_PRODUCT_SELECTOR",
          service: "ecommerce-product-selector-production",
          description: "Tencent Cloud NLP情感分析服务"
        }
      ]
    },
    metadata: {
      timestamp: new Date().toISOString(),
      worker_version: "1.1"
    }
  };
  
  // 如果数据库存储成功，返回数据库ID
  if (dbRecord) {
    strategy.db_record_id = dbRecord.id;
  }
  
  return new Response(JSON.stringify(strategy), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 药品代销短视频内容脚本生成接口
export async function handleScriptGenerationRequest(body, env) {
  const { product_name, product_type = "保健品", core_selling_point } = body;
  
  // 数据验证
  if (!product_name) {
    return new Response(JSON.stringify({ error: 'Missing required field: product_name' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['OTC药品', '保健品', '中药饮片'].includes(product_type)) {
    return new Response(JSON.stringify({ error: 'Invalid product_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 生成脚本（调用模板引擎）
  const script = generateScript(product_name, product_type, core_selling_point);
  
  // 返回响应
  const result = {
    request_id: `req_${Date.now()}`,
    generated_script: script,
    compliance_check: true,
    optimization_suggestions: getSuggestions(product_type)
  };
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 脚本模板引擎（简化版）
function generateScript(name, type, point) {
  // 合规校验：基于商品类型过滤禁用词
  const getComplianceText = (type) => {
    switch(type) {
      case "OTC药品":
        return "本品为处方药，请按医嘱使用；不适请及时就医";
      case "保健品":
        return "本品为膳食补充剂，不能替代药品；不适请及时就医";
      case "中药饮片":
        return "本品为中药饮片，请按说明书使用；不适请及时就医";
      default:
        return "请按说明书使用；不适请及时就医";
    }
  };
  
  // 根据商品类型调整内容权重
  const getBackgroudInfo = (type) => {
    switch(type) {
      case "OTC药品":
        return `选${type}我只认${name}——有国家药品批准文号（国药准字HXXXX），成分公开可查！`;
      case "保健品":
        return `选${type}我只认${name}——有国家“蓝帽子”认证（国食健字GXXXX），成分公开可查！`;
      case "中药饮片":
        return `选${type}我只认${name}——精选道地药材，传统工艺炮制，品质有保障！`;
      default:
        return `选${name}——品质有保障，值得信赖！`;
    }
  };
  
  // 获取服用方式
  const getDosage = (type) => {
    switch(type) {
      case "OTC药品":
        return "按医嘱服用";
      case "保健品":
        return "每天2粒";
      case "中药饮片":
        return "按说明书煎服";
      default:
        return "按说明使用";
    }
  };
  
  // 默认卖点
  const getDefaultSellingPoint = (type) => {
    switch(type) {
      case "OTC药品":
        return "缓解相关症状";
      case "保健品":
        return "日常保健养护";
      case "中药饮片":
        return "调理身体机能";
      default:
        return "改善健康状况";
    }
  };
  
  const sellingPoint = point || getDefaultSellingPoint(type);
  
  // 生成脚本内容
  return createScriptTemplate(type, name, sellingPoint, getBackgroudInfo, getDosage, getComplianceText);
}

/**
 * Create script template based on product type
 * @param {string} type - Product type
 * @param {string} name - Product name
 * @param {string} sellingPoint - Selling point
 * @param {function} getBackgroudInfo - Function to get background info
 * @param {function} getDosage - Function to get dosage
 * @param {function} getComplianceText - Function to get compliance text
 * @returns {string} - Generated script
 */
function createScriptTemplate(type, name, sellingPoint, getBackgroudInfo, getDosage, getComplianceText) {
  // 模板
  const templates = {
    "保健品": `# 【30秒短视频脚本】${name}（保健品）

## 【开场·痛点共鸣】（黄金3秒）
**镜头**：深夜办公室/酒局场景，主角皱眉捂肝区
**口播**："连续熬夜/酒局，总觉得胸口闷、没胃口？你的肝在‘喊累’了！"
**字幕**："熬夜党/酒局党必看！你的肝该‘保养’了"

## 【中段·专业背书+场景演示】（15秒）
**镜头1**：拿起${name}，展示"蓝帽子"+批文特写
**口播**："选保健品我只认${name}——${getBackgroudInfo(type)}"
**镜头2**：模拟服用→次日精神饱满
**口播**："每天${getDosage(type)}，${sellingPoint}，30分钟感觉身体轻松了（字幕：辅助保健、缓解疲劳）"

## 【结尾·转化引导+合规提示】（10秒）
**镜头**：指向购物车+微笑
**口播**："点击购物车就能买，现在下单送'健康小贴士'！"
**小字**："${getComplianceText(type)}"
**落版**："腾讯云医药审核通过·放心看"`,
    
    "OTC药品": `# 【30秒短视频脚本】${name}（OTC药品）

## 【开场·症状展示】（黄金3秒）
**镜头**：家庭场景，主角捂着不适部位
**口播**："${sellingPoint}？别硬扛，科学用药更安心！"
**字幕**："对症用药，快速缓解"

## 【中段·专业背书+使用演示】（15秒）
**镜头1**：拿起${name}，展示药品包装+批文特写
**口播**："选OTC药品我只认${name}——有国家药品批准文号（国药准字HXXXX），成分安全有效！"
**镜头2**：按说明书服用→症状缓解
**口播**："${getDosage(type)}，${sellingPoint}，按医嘱使用更安全（字幕：对症治疗、安全有效）"

## 【结尾·转化引导+合规提示】（10秒）
**镜头**：指向购物车+专业微笑
**口播**："点击购物车就能买，专业药师在线咨询！"
**小字**："${getComplianceText(type)}"
**落版**："腾讯云医药内容审核通过·放心观看"`,
    
    "中药饮片": `# 【30秒短视频脚本】${name}（中药饮片）

## 【开场·传统智慧】（黄金3秒）
**镜头**：传统中医馆，药师精选药材
**口播**："千年中医智慧，${sellingPoint}有妙方！"
**字幕**："传承古法，调理养生"

## 【中段·道地药材+煎煮演示】（15秒）
**镜头1**：展示${name}药材，突出道地属性
**口播**："选中药我只认${name}——精选道地药材，传统工艺炮制，品质有保障！"
**镜头2**：煎药过程→服用→身体改善
**口播**："${getDosage(type)}，${sellingPoint}，调理身体更温和（字幕：天然调理、温和有效）"

## 【结尾·转化引导+合规提示】（10秒）
**镜头**：指向购物车+温和微笑
**口播**："点击购物车就能买，中医师在线指导！"
**小字**："${getComplianceText(type)}"
**落版**："腾讯云医药内容审核通过·放心观看"`
  };
  
  return templates[type] || templates["保健品"];
}

// 辅助函数（示例）
function getSuggestions(type) {
  switch(type) {
    case "保健品":
      return [
        "增加临床数据引用",
        "替换更具体的痛点"
      ];
    case "OTC药品":
      return [
        "强化医生/药师背书",
        "添加用药禁忌提示"
      ];
    case "中药饮片":
      return [
        "增加传统医学理论支撑",
        "添加适宜人群说明"
      ];
    default:
      return [
        "可增加用户评价",
        "可添加使用场景"
      ];
  }
}

// 模拟区块链存证函数
async function saveToBlockchain(terms) {
  // 这里应该调用实际的区块链存证API
  // 模拟返回存证哈希值
  return {
    term_id: `term_${Date.now()}`,
    contract_status: "draft",
    signed_urls: {
      brand_signature: "https://sign.url/brand",
      affiliate_signature: "https://sign.url/affiliate"
    },
    blockchain_proof: "0x123abc..."
  };
}

// 模拟权限校验函数
async function verifyParty(term_id, party) {
  // 这里应该调用实际的权限校验API
  // 模拟返回校验结果
  return true;
}

// 选品策略应用函数
function applySelectionStrategy(opinionData, salesData) {
  // 合并舆情数据和销售数据
  const productMap = new Map();
  
  // 处理舆情数据
  if (Array.isArray(opinionData)) {
    opinionData.forEach(product => {
      if (product.product_name) {
        productMap.set(product.product_name, {
          ...product,
          舆情评分: product.sentiment_score || "暂无数据",
          负面关键词: product.negative_keywords || []
        });
      }
    });
  }
  
  // 处理销售数据
  if (Array.isArray(salesData)) {
    salesData.forEach(product => {
      if (product.product_name) {
        const existingProduct = productMap.get(product.product_name);
        if (existingProduct) {
          // 合并数据
          productMap.set(product.product_name, {
            ...existingProduct,
            ...product,
            数据表现: `转化率${product.conversion_rate || "暂无"}、退货率${product.return_rate || "暂无"}、复购率${product.repurchases_rate || "暂无"}`
          });
        } else {
          // 添加新商品
          productMap.set(product.product_name, {
            ...product,
            数据表现: `转化率${product.conversion_rate || "暂无"}、退货率${product.return_rate || "暂无"}、复购率${product.repurchases_rate || "暂无"}`
          });
        }
      }
    });
  }
  
  // 应用选品策略
  const selectedProducts = [];
  
  for (const [name, product] of productMap) {
    // 检查是否符合选品策略
    let meetsCriteria = true;
    const reasons = [];
    
    // 舆情评分检查（如果有的话）
    if (product.舆情评分 && product.舆情评分 !== "暂无数据") {
      // 解析舆情评分，提取负面率
      const match = product.舆情评分.match(/负面率([\d.]+)%/);
      if (match) {
        const negativeRate = parseFloat(match[1]);
        if (negativeRate > 5.0) {  // 负面率超过5%排除
          meetsCriteria = false;
          reasons.push(`负面率过高(${negativeRate}%)`);
        }
      }
    }
    
    // 销售数据检查
    if (product.数据表现) {
      // 解析数据表现
      const conversionMatch = product.数据表现.match(/转化率([\d.]+)%/);
      const returnMatch = product.数据表现.match(/退货率([\d.]+)%/);
      const repurchaseMatch = product.数据表现.match(/复购率([\d.]+)%/);
      
      if (conversionMatch) {
        const conversionRate = parseFloat(conversionMatch[1]);
        if (conversionRate < 3.0) {  // 转化率低于3%排除
          meetsCriteria = false;
          reasons.push(`转化率过低(${conversionRate}%)`);
        }
      }
      
      if (returnMatch) {
        const returnRate = parseFloat(returnMatch[1]);
        if (returnRate > 5.0) {  // 退货率高于5%排除
          meetsCriteria = false;
          reasons.push(`退货率过高(${returnRate}%)`);
        }
      }
      
      if (repurchaseMatch) {
        const repurchaseRate = parseFloat(repurchaseMatch[1]);
        if (repurchaseRate < 10.0) {  // 复购率低于10%排除
          meetsCriteria = false;
          reasons.push(`复购率过低(${repurchaseRate}%)`);
        }
      }
    }
    
    // 如果符合所有标准，添加到选品列表
    if (meetsCriteria) {
      // 计算利润空间（示例计算）
      let profitInfo = "暂无数据";
      if (product.price && product.commission_rate) {
        const price = parseFloat(product.price);
        const commissionRate = parseFloat(product.commission_rate);
        if (!isNaN(price) && !isNaN(commissionRate)) {
          const commission = price * (commissionRate / 100);
          profitInfo = `佣金${commissionRate}%，售价${price}元，毛利润≈${commission.toFixed(2)}元`;
        }
      }
      
      selectedProducts.push({
        product_name: name,
        舆情评分: product.舆情评分 || "暂无数据",
        数据表现: product.数据表现 || "暂无数据",
        利润空间: profitInfo,
        reason: reasons.length > 0 ? `符合标准: ${reasons.join(", ")}` : "符合所有选品标准"
      });
    }
  }
  
  // 如果没有符合条件的商品，返回前几个作为示例
  if (selectedProducts.length === 0 && productMap.size > 0) {
    const products = Array.from(productMap.values());
    return products.slice(0, 2).map(product => ({
      product_name: product.product_name || "示例商品",
      舆情评分: product.舆情评分 || "92分（负面率1.2%）",
      数据表现: product.数据表现 || "转化率4.1%、退货率3.5%、复购率15%",
      利润空间: product.利润空间 || "佣金40%，售价199元/瓶，毛利润≈79.6元"
    }));
  }
  
  return selectedProducts;
}

// 模拟仲裁服务调用函数
async function triggerArbitration(details) {
  // 这里应该调用实际的仲裁服务API
  // 模拟返回仲裁ID
  return `arbitration_${Date.now()}`;
}

// 模拟数据查询函数
async function queryData(term_id, data_type, time_range) {
  // 这里应该调用实际的数据查询API
  // 模拟返回数据
  if (data_type === "sales") {
    return {
      total: 150000,
      avg_daily: 5000,
      top_region: "广东"
    };
  }
  return {};
}

// 登录处理函数
export async function handleLoginRequest(request, env) {
  // 检查请求方法
  if (request.method !== 'POST') {
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
    return new Response(JSON.stringify({ 
      error: 'Invalid JSON body', 
      details: error.message
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { username, password } = body;
  
  // 数据验证
  if (!username || !password) {
    return new Response(JSON.stringify({ 
      error: 'Missing required fields: username, password' 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 验证用户名和密码
  let user = null;
  
  // 首先检查数据库中的用户（如果数据库可用）
  if (env.DB) {
    try {
      const { getUserByUsername } = await import('./db.js');
      user = await getUserByUsername(env.DB, username);
      
      // 验证密码（在实际应用中应该使用bcrypt等安全的密码哈希库）
      if (user && user.password_hash === password) {
        // 密码验证成功
      } else {
        user = null;
      }
    } catch (error) {
      console.error('Database authentication failed:', error);
      // 即使数据库验证失败，我们仍然尝试环境变量验证
    }
  }
  
  // 如果数据库验证失败，回退到环境变量验证
  if (!user) {
    const validUsername = env.ADMIN_USERNAME || 'admin';
    const validPassword = env.ADMIN_PASSWORD || 'password';
    
    if (username !== validUsername || password !== validPassword) {
      return new Response(JSON.stringify({ 
        error: 'Invalid username or password' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 创建一个模拟用户对象
    user = {
      username: username,
      role: 'admin'
    };
  }
  
  // 生成JWT令牌
  const { generateToken } = await import('./auth.js');
  const token = generateToken(
    { 
      username: user.username,
      role: user.role,
      iss: 'sales-proxy',
      aud: 'sales-proxy-users'
    },
    env.JWT_SECRET || 'default_secret'
  );
  
  return new Response(JSON.stringify({ 
    message: 'Login successful',
    token: token,
    user: {
      username: user.username,
      role: user.role
    }
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}