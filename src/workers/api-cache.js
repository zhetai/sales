/**
 * API Response Caching Utility
 * Handles caching of API responses with different TTL strategies
 */

// 缓存存储
const CACHE_NAME = 'sales-proxy-api-cache-v1';

// 不同类型API的缓存TTL（毫秒）
const API_CACHE_TTL = {
  // 静态数据，可以长时间缓存
  'drug-selection-strategy': 30 * 60 * 1000, // 30分钟
  'cooperation-terms': 60 * 60 * 1000, // 1小时
  
  // 中等变化频率的数据
  'dashboard-config': 10 * 60 * 1000, // 10分钟
  'indicator-query': 5 * 60 * 1000, // 5分钟
  
  // 高频变化的数据
  'real-time-indicators': 30 * 1000, // 30秒
  'influencer-data': 60 * 1000, // 1分钟
  
  // 默认TTL
  'default': 5 * 60 * 1000 // 5分钟
};

/**
 * Generate a cache key for API requests
 * @param {Request} request - The incoming request
 * @param {string} apiType - The type of API (e.g., 'dashboard-config')
 * @returns {string} - The cache key as a fully-qualified URL
 */
function generateCacheKey(request, apiType) {
  const url = new URL(request.url);
  const keyParts = [
    apiType,
    url.pathname,
    url.search
  ];
  
  // For POST requests, include the body hash in the cache key
  if (request.method === 'POST') {
    // In a real implementation, we would hash the body
    // For now, we'll use a placeholder
    keyParts.push('post-body-hash-placeholder');
  }
  
  // Create a cache key as a fully-qualified URL
  const cacheKey = new URL(url.origin);
  cacheKey.pathname = `/cache/${keyParts.join('::')}`;
  return cacheKey.toString();
}

/**
 * Get cached API response
 * @param {Request} request - The incoming request
 * @param {string} apiType - The type of API (e.g., 'dashboard-config')
 * @returns {Response|null} - The cached response or null if not found/valid
 */
export async function getCachedApiResponse(request, apiType) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = generateCacheKey(request, apiType);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const cacheTime = cachedResponse.headers.get('x-cache-time');
      const ttl = API_CACHE_TTL[apiType] || API_CACHE_TTL['default'];
      
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < ttl) {
        // 更新缓存的最后访问时间（用于LRU策略）
        const headers = new Headers(cachedResponse.headers);
        headers.set('x-cache-last-access', Date.now().toString());
        headers.set('x-cache-hit', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      } else {
        // 缓存过期，删除
        await cache.delete(cacheKey);
      }
    }
  } catch (e) {
    console.error('API cache read error:', e);
  }
  
  return null;
}

/**
 * Cache an API response
 * @param {Request} request - The incoming request
 * @param {Response} response - The response to cache
 * @param {string} apiType - The type of API (e.g., 'dashboard-config')
 */
export async function cacheApiResponse(request, response, apiType) {
  try {
    // 只缓存成功的响应
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = generateCacheKey(request, apiType);
      
      // 克隆响应并添加缓存时间戳
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('x-cache-time', Date.now().toString());
      headers.set('x-cache-last-access', Date.now().toString());
      headers.set('x-cache-api-type', apiType);
      
      const responseToCache = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });
      
      // 获取TTL并设置缓存
      const ttl = API_CACHE_TTL[apiType] || API_CACHE_TTL['default'];
      
      // Store with expiration (using a custom header approach)
      await cache.put(cacheKey, responseToCache);
    }
  } catch (e) {
    console.error('API cache write error:', e);
  }
}

/**
 * Invalidate cached API responses by type
 * @param {string} apiType - The type of API to invalidate (e.g., 'dashboard-config')
 */
export async function invalidateApiCacheByType(apiType) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        const cachedApiType = cachedResponse.headers.get('x-cache-api-type');
        if (cachedApiType === apiType) {
          await cache.delete(request);
        }
      }
    }
  } catch (e) {
    console.error('API cache invalidation error:', e);
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export async function getCacheStats() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    let totalEntries = 0;
    let totalSize = 0;
    const apiTypeCounts = {};
    
    for (const request of keys) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        totalEntries++;
        // Estimate size (this is approximate)
        const body = await cachedResponse.clone().text();
        totalSize += body.length;
        
        const apiType = cachedResponse.headers.get('x-cache-api-type') || 'unknown';
        apiTypeCounts[apiType] = (apiTypeCounts[apiType] || 0) + 1;
      }
    }
    
    return {
      totalEntries,
      totalSize,
      apiTypeCounts,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error('Cache stats error:', e);
    return {
      error: 'Failed to retrieve cache stats',
      timestamp: new Date().toISOString()
    };
  }
}