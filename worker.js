// 缓存存储
const CACHE_NAME = 'sales-proxy-cache-v2';
const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

export default {
  async fetch(request, env) {
    // 添加环境变量检查
    const environment = env.ENVIRONMENT || 'development';
    
    // 日志记录 - 记录环境信息和请求
    console.log(`[${environment}] Request received: ${request.method} ${request.url}`);
    
    // 检查是否为API请求
    const url = new URL(request.url);
    
    // 对于GET请求且不是API请求，尝试使用缓存
    if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
      const cachedResponse = await getFromCache(request);
      if (cachedResponse) {
        console.log(`[${environment}] Cache hit for: ${request.url}`);
        return cachedResponse;
      }
      console.log(`[${environment}] Cache miss for: ${request.url}`);
    }
    
    // 处理运营策略模块的单独路由（需要在通用API路由之前处理）
    if (url.pathname === '/api/traffic-operation' && request.method === 'POST') {
      return await handleTrafficOperationRequest(request, env);
    }
    
    // 处理风控与售后模块的单独路由
    if (url.pathname === '/api/risk-control-and-after-sales' && request.method === 'POST') {
      return await handleRiskControlRequest(request, env);
    }
    
    // 处理数据化运营指标模块的单独路由
    if (url.pathname === '/api/data-operation-dashboard' && request.method === 'POST') {
      return await handleDataOperationRequest(request, env);
    }
    
    // 处理代销合作模式模块的单独路由
    if (url.pathname === '/api/cooperation-model' && request.method === 'POST') {
      return await handleCooperationModelRequest(request, env);
    }
    
    // 处理API模块路由
    if (url.pathname.startsWith('/api/')) {
      const moduleName = url.pathname.substring(5); // 移除 '/api/' 前缀
      
      // 对于GET请求，直接处理特定模块
      if (request.method === 'GET') {
        switch(moduleName) {
          case 'drug-selection-strategy':
            return handleSelectionStrategyRequest(request, env);
          default:
            return new Response(JSON.stringify({ error: 'Invalid module name or method not allowed', module: moduleName }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
      }
      
      // 对于POST请求，重构请求体以匹配模块名称
      if (request.method === 'POST') {
        let body = {};
        try {
          body = await request.json();
        } catch (e) {
          // 如果不是JSON格式，使用空对象
        }
        const newBody = { ...body, module_name: moduleName };
        
        // 创建新的请求对象，但是使用原始请求的其他属性
        const newRequest = new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify(newBody)
        });
        
        return await handleRequest(newRequest, env);
      }
    }
    
    // 处理POST请求（非API）
    if (request.method === 'POST') {
      return await handleRequest(request, env);
    }
    
    // 处理静态页面请求 (GET请求)
    try {
      const response = await env.ASSETS.fetch(request);
      // 添加缓存控制头以避免304问题
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300'); // 10分钟缓存，5分钟宽限
      newHeaders.set('Expires', new Date(Date.now() + 600000).toUTCString());
      
      // 如果是GET请求，缓存响应
      if (request.method === 'GET') {
        await putInCache(request, response);
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      console.error('Static asset fetch failed:', e);
      return new Response('Static asset fetch failed: ' + e.message, { status: 500 });
    }
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

// 缓存函数
async function getFromCache(request) {
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

async function putInCache(request, response) {
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

// 模拟权限校验函数
async function verifyParty(term_id, party) {
  // 这里应该调用实际的权限校验API
  // 模拟返回校验结果
  return true;
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

// 药品代销风控与售后综合API处理函数
async function handleRiskControlRequest(request, env) {
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
  // console.log('Received module name:', module);
  // console.log('Request body:', JSON.stringify(body));

  switch(module) {
    case 'tencent_cloud_medical_content_audit':
      return handleContentAudit(body, env);
    case 'compliant_pharmacist_transfer':
      return handlePharmacistTransfer(body, env);
    case 'drug_registration_wechat_notification':
      return handleWechatNotification(body, env);
    case 'return_refund_auto_review':
      return handleReturnReview(body, env);
    default:
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// 药品代销短视频流量运营综合API处理函数
async function handleTrafficOperationRequest(request, env) {
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
  // console.log('Received module name:', module);
  // console.log('Request body:', JSON.stringify(body));

  switch(module) {
    case 'chanmama_ad_placement':
      return handleChanmamaAdPlacement(body, env);
    case 'jietiao_smart_clipping':
      return handleJietiaoSmartClipping(body, env);
    case 'influencer_recommendation':
      return handleInfluencerRecommendation(body, env);
    case 'publish_schedule_webhook':
      return handlePublishScheduleWebhook(body, env);
    default:
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// 腾讯云医药内容审核处理函数
async function handleContentAudit(body, env) {
  const { content_type, content, product_id } = body;
  
  // 数据验证
  if (!content_type || !content) {
    return new Response(JSON.stringify({ error: 'Missing required fields: content_type, content' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!['video_script', 'product_copy', 'live_comment'].includes(content_type)) {
    return new Response(JSON.stringify({ error: 'Invalid content_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 模拟调用腾讯云医药审核API
  // 实际实现中应该调用真实的API
  const auditResult = {
    audit_id: `audit_${Date.now()}`,
    audit_result: "warning",
    violation_details: [
      { type: "疗效夸大", position: "第3行第5列", suggestion: "替换为'辅助缓解肝区不适'" }
    ],
    risk_level: "medium"
  };
  
  return new Response(JSON.stringify(auditResult), { headers: { 'Content-Type': 'application/json' } });
}

// 合规药师转接处理函数
async function handlePharmacistTransfer(body, env) {
  const { user_question, product_id, user_info } = body;
  
  // 数据验证
  if (!user_question || !user_info) {
    return new Response(JSON.stringify({ error: 'Missing required fields: user_question, user_info' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 模拟转接第三方合规药师
  // 实际实现中应该调用真实的药师平台API
  const transferResult = {
    transfer_id: `transfer_${Date.now()}`,
    transfer_status: "accepted",
    pharmacist_reply: "护肝片不建议与酒精同服，可能加重肝脏负担。如需饮酒，请间隔2小时以上。"
  };
  
  return new Response(JSON.stringify(transferResult), { headers: { 'Content-Type': 'application/json' } });
}

// 微信报备通知处理函数
async function handleWechatNotification(body, env) {
  const { report_info, webhook_url } = body;
  
  // 数据验证
  if (!report_info || !webhook_url) {
    return new Response(JSON.stringify({ error: 'Missing required fields: report_info, webhook_url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 模拟发送微信通知
  // 实际实现中应该调用真实的Webhook API
  const notificationResult = {
    notification_id: `notify_${Date.now()}`,
    notification_status: "sent"
  };
  
  return new Response(JSON.stringify(notificationResult), { headers: { 'Content-Type': 'application/json' } });
}

// 退换货自动审核处理函数
async function handleReturnReview(body, env) {
  const { return_request, product_info, order_info } = body;
  
  // 数据验证
  if (!return_request || !product_info || !order_info) {
    return new Response(JSON.stringify({ error: 'Missing required fields: return_request, product_info, order_info' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  // 模拟退换货自动审核
  // 实际实现中应该基于规则引擎进行审核
  const reviewResult = {
    review_id: `review_${Date.now()}`,
    review_result: "approved",
    action_taken: "已发起退款，预计1-3个工作日到账",
    rejection_reason: ""
  };
  
  return new Response(JSON.stringify(reviewResult), { headers: { 'Content-Type': 'application/json' } });
}

// 药品代销数据化运营指标综合API处理函数
async function handleDataOperationRequest(request, env) {
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
  // console.log('Received module name:', module);
  // console.log('Request body:', JSON.stringify(body));

  switch(module) {
    case 'operation_indicator_query':
      return handleIndicatorQuery(body, env);
    case 'dashboard_config_generator':
      return handleDashboardConfig(body, env);
    case 'real_time_indicator_push':
      return handleRealTimePush(body, env);
    default:
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// 药品代销合作模式管理API处理函数
async function handleCooperationModelRequest(request, env) {
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
  // console.log('Received module name:', module);
  // console.log('Request body:', JSON.stringify(body));

  switch(module) {
    case 'cooperation_term_configuration':
      return handleTermConfiguration(body, env);
    case 'rights_and_responsibilities_manager':
      return handleRightsManagement(body, env);
    case 'cooperation_process_tracker':
      return handleProcessTracking(body, env);
    case 'data_sharing_portal':
      return handleDataSharing(body, env);
    default:
      return new Response(JSON.stringify({ error: 'Invalid module name', module: module }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

async function handleRequest(request, env) {
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
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

// 实时指标推送处理函数
async function handleRealTimePush(body, env) {
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
  
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
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
  // 从环境变量中获取达人库URL
  const influencerDbUrl = env.INFLUENCER_DB_URL || 'https://api.example.com/influencers';
  
  // 条件匹配：匹配商品类型、平台、预算（如腰部达人坑位费500-2000元）
  let influencers = [];
  try {
    // 调用达人库API获取符合条件的达人
    const response = await fetch(`${influencerDbUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.INFLUENCER_API_KEY || 'default_key'}`
      },
      body: JSON.stringify({
        product_type: product_type,
        platform: target_platform,
        budget_range: budget_range
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      influencers = data.influencers || [];
    } else {
      // 如果API调用失败，回退到模拟数据
      console.error('Failed to fetch influencers from API, using mock data');
      influencers = [
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
    }
  } catch (error) {
    // 如果出现网络错误，回退到模拟数据
    console.error('Error fetching influencers, using mock data:', error);
    influencers = [
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
  }
  
  // 合规校验：排除有药品违规记录的达人
  // 这里简化处理，实际应调用合规校验服务
  
  // 排序：按"带货转化率×粉丝精准度"降序排列
  influencers.sort((a, b) => {
    const aRate = parseFloat(a.conversion_rate) || 0;
    const bRate = parseFloat(b.conversion_rate) || 0;
    return bRate - aRate;
  });
  
  // 限制返回的达人数量为5个
  const topInfluencers = influencers.slice(0, 5);
  
  const result = {
    influencers: topInfluencers,
    recommendation_reason: `匹配${product_type}品类，近30天转化率＞3.5%，无违规记录`,
    total_count: influencers.length,
    data_source: influencers.length > 0 && influencers[0].name !== "健康小夏（抖音）" ? "real_time" : "mock"
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
async function handleSelectionStrategyRequest(request, env) {
  // 获取实时选品数据
  let selectedProducts = [];
  let dataSource = "mock";
  
  try {
    // 从环境变量获取API密钥
    const bqyunApiKey = env.BQYUN_API_KEY || 'default_bqyun_key';
    const chanmamaApiKey = env.CHANMAMA_API_KEY || 'default_chanmama_key';
    
    // 调用清博舆情API获取舆情数据
    const publicOpinionResponse = await fetch('https://api.bqyun.com/products/opinion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bqyunApiKey}`
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
    
    // 调用蝉妈妈API获取销售数据
    const salesDataResponse = await fetch('https://api.chanmama.com/products/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chanmamaApiKey}`
      },
      body: JSON.stringify({
        time_range: "近30天",
        metrics: ["转化率", "退货率", "复购率"]
      })
    });
    
    if (publicOpinionResponse.ok && salesDataResponse.ok) {
      const opinionData = await publicOpinionResponse.json();
      const salesData = await salesDataResponse.json();
      
      // 合并数据并应用选品策略
      selectedProducts = applySelectionStrategy(opinionData.products, salesData.products);
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
  
  // 选品策略逻辑
  const strategy = {
    api_name: "drug_affiliate_video_sales_selection_strategy",
    version: "1.1",
    description: "药品代销短视频带货选品策略API，覆盖舆情反向选品、热点借势、数据验证及利润测算",
    config: {
      public_opinion_monitoring: {
        tool: "清博舆情系统",
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
        "BQYUN_API_KEY", // 清博舆情API密钥
        "CHANMAMA_API_KEY" // 蝉妈妈API密钥
      ]
    },
    metadata: {
      timestamp: new Date().toISOString(),
      worker_version: "1.1"
    }
  };
  
  return new Response(JSON.stringify(strategy), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 药品代销短视频内容脚本生成接口
async function handleScriptGenerationRequest(body, env) {
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
}// 选品策略应用函数
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

// 安全审计日志记录函数
function logSecurityEvent(eventType, details, environment = 'unknown') {
  const auditLog = {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    environment: environment,
    details: details,
    worker_version: '1.1'
  };
  
  // 在开发环境中输出到控制台，在生产环境中可以发送到专门的日志服务
  console.log(`[AUDIT] ${JSON.stringify(auditLog)}`);
  
  // 如果需要，可以将审计日志存储到KV存储中
  // 这里简化处理，实际实现中应该异步存储到持久化存储中
}

// 部署审计日志记录函数
function logDeploymentAudit(commitSha, deployer, environment, workflowRunId) {
  const deploymentLog = {
    timestamp: new Date().toISOString(),
    event_type: 'deployment',
    environment: environment,
    commit_sha: commitSha || 'unknown',
    deployer: deployer || 'unknown',
    workflow_run_id: workflowRunId || 'unknown',
    worker_version: '1.1'
  };
  
  console.log(`[DEPLOYMENT_AUDIT] ${JSON.stringify(deploymentLog)}`);
}