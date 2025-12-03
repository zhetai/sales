/**
 * Main Sales Proxy Worker
 * Entry point for the Cloudflare Worker application
 * 
 * This worker handles:
 * - API requests for various modules (traffic-operation, risk-control, etc.)
 * - Static asset serving
 * - Caching strategies for performance optimization
 * - JWT-based authentication for protected endpoints
 * - Cloudflare D1 database integration for persistent storage
 * - Comprehensive logging and monitoring
 * 
 * @module main-worker
 */

import { getFromCache, putInCache, handleRequest, handleSelectionStrategyRequest, handleLoginRequest } from './utils.js';
import { handleTrafficOperationRequest } from './traffic-operation.js';
import { handleRiskControlRequest } from './risk-control.js';
import { handleDataOperationRequest } from './data-operation.js';
import { handleCooperationModelRequest } from './cooperation-model.js';
import { getCachedApiResponse, cacheApiResponse } from './api-cache.js';
import { authMiddleware, withAuth } from './auth.js';
import { initDatabase } from './db.js';
import { requestLogger, Logger, LOG_LEVELS } from './logging.js';

/**
 * Main fetch event handler
 * 
 * @param {Request} request - The incoming request
 * @param {Object} env - The environment variables
 * @param {Object} ctx - The execution context
 * @returns {Response} - The response to the request
 */
export default {
  async fetch(request, env, ctx) {
    // 创建一个logger实例
    const logger = new Logger(
      env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL] : LOG_LEVELS.INFO,
      'sales-proxy-main'
    );
    
    // 记录worker启动
    logger.info('Worker started', {
      requestId: crypto.randomUUID(),
      url: request.url,
      method: request.method
    });
    
    // 初始化数据库
    if (env.DB) {
      try {
        await initDatabase(env.DB);
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    }
    
    // 使用请求日志记录中间件包装整个处理过程
    return await requestLogger(request, env, async () => {
      // 检查是否为API请求
      const url = new URL(request.url);
    
    // 对于GET请求且不是API请求，尝试使用缓存
    if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
      const cachedResponse = await getFromCache(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // 对于API请求，尝试使用API缓存
    if (url.pathname.startsWith('/api/')) {
      // 特殊处理GET请求的选品策略API
      if (request.method === 'GET' && url.pathname === '/api/drug-selection-strategy') {
        const cachedResponse = await getCachedApiResponse(request, 'drug-selection-strategy');
        if (cachedResponse) {
          return cachedResponse;
        }
        
        const response = handleSelectionStrategyRequest(request, env);
        await cacheApiResponse(request, response, 'drug-selection-strategy');
        return response;
      }
      
      // 处理POST请求的API缓存
      if (request.method === 'POST') {
        // 根据API路径确定缓存类型
        let apiType = 'default';
        const moduleName = url.pathname.substring(5); // 移除 '/api/' 前缀
        
        // 确定API类型用于缓存
        switch(moduleName) {
          case 'dashboard_config_generator':
            apiType = 'dashboard-config';
            break;
          case 'operation_indicator_query':
            apiType = 'indicator-query';
            break;
          case 'influencer_recommendation':
            apiType = 'influencer-data';
            break;
          default:
            apiType = 'default';
        }
        
        // 尝试从缓存获取响应
        const cachedResponse = await getCachedApiResponse(request, apiType);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 如果没有缓存，处理请求
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
        
        const response = await handleRequest(newRequest, env);
        
        // 缓存响应
        await cacheApiResponse(request, response, apiType);
        return response;
      }
    }
    
    // 处理运营策略模块的单独路由（需要在通用API路由之前处理）
    if (url.pathname === '/api/traffic-operation' && request.method === 'POST') {
      const response = await handleTrafficOperationRequest(request, env);
      return response;
    }
    
    // 处理风控与售后模块的单独路由
    if (url.pathname === '/api/risk-control-and-after-sales' && request.method === 'POST') {
      const response = await handleRiskControlRequest(request, env);
      return response;
    }
    
    // 处理数据化运营指标模块的单独路由
    if (url.pathname === '/api/data-operation-dashboard' && request.method === 'POST') {
      const response = await handleDataOperationRequest(request, env);
      return response;
    }
    
    // 处理代销合作模式模块的单独路由（需要认证）
    if (url.pathname === '/api/cooperation-model' && request.method === 'POST') {
      return await authMiddleware(request, env, async () => {
        const response = await handleCooperationModelRequest(request, env);
        return response;
      });
    }
    
    // 处理API模块路由
    if (url.pathname.startsWith('/api/')) {
      const moduleName = url.pathname.substring(5); // 移除 '/api/' 前缀
      
      // 处理登录请求
      if (moduleName === 'login' && request.method === 'POST') {
        const response = await handleLoginRequest(request, env);
        return response;
      }
      
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
        
        const response = await handleRequest(newRequest, env);
        return response;
      }
    }
    
    // 处理POST请求（非API）
    if (request.method === 'POST') {
      const response = await handleRequest(request, env);
      return response;
    }
    
    // 处理静态页面请求 (GET请求)
    try {
      const response = await env.ASSETS.fetch(request);
      // 添加缓存控制头以避免304问题
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300'); // 10分钟缓存，5分钟宽限
      newHeaders.set('Expires', new Date(Date.now() + 600000).toUTCString());
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      
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
      return new Response('Static asset fetch failed: ' + e.message, { 
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    }); // 结束 requestLogger 回调函数
  } // 结束 fetch 函数
} // 结束 default 导出对象