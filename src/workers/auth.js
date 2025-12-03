/**
 * Authentication middleware for JWT-based authentication
 * Using Web Crypto API instead of jsonwebtoken package
 */

// Utility functions for JWT handling using Web Crypto API
async function importKey(secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(arrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return new Uint8Array([...atob(str)].map(c => c.charCodeAt(0)));
}

async function sign(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encoder = new TextEncoder();
  const secretKey = await importKey(secret);

  const headerStr = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadStr = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = encoder.encode(`${headerStr}.${payloadStr}`);

  const signature = await crypto.subtle.sign('HMAC', secretKey, data);
  const signatureStr = base64UrlEncode(signature);

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

async function verify(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [headerStr, payloadStr, signatureStr] = parts;
  const encoder = new TextEncoder();
  const secretKey = await importKey(secret);

  const data = encoder.encode(`${headerStr}.${payloadStr}`);
  const signature = base64UrlDecode(signatureStr);

  const isValid = await crypto.subtle.verify('HMAC', secretKey, signature, data);
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadStr)));
  
  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to sign
 * @param {string} secret - The secret key to sign the token
 * @param {Object} options - The options for signing the token
 * @returns {Promise<string>} The signed JWT token
 */
export async function generateToken(payload, secret, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || '24h';
  
  // Convert expiresIn to seconds
  let expSeconds;
  if (typeof expiresIn === 'number') {
    expSeconds = expiresIn;
  } else if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 's': expSeconds = value; break;
        case 'm': expSeconds = value * 60; break;
        case 'h': expSeconds = value * 3600; break;
        case 'd': expSeconds = value * 86400; break;
        default: expSeconds = 86400; // default to 24h
      }
    } else {
      expSeconds = 86400; // default to 24h
    }
  } else {
    expSeconds = 86400; // default to 24h
  }

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expSeconds
  };

  return await sign(fullPayload, secret);
}

/**
 * Verify a JWT token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret key to verify the token
 * @returns {Promise<Object|null>} The decoded token payload or null if invalid
 */
export async function verifyToken(token, secret) {
  try {
    return await verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Authentication middleware
 * @param {Request} request - The incoming request
 * @param {Object} env - The environment variables
 * @param {Function} next - The next middleware function
 * @returns {Promise<Response|any>} The response or result of the next middleware
 */
export async function authMiddleware(request, env, next) {
  // 获取认证头
  const authHeader = request.headers.get('Authorization')
  
  // 如果没有认证头，返回401错误
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // 检查认证头是否以Bearer开头
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Invalid Authorization header format' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // 提取token
  const token = authHeader.substring(7)
  
  // 验证token
  const decoded = await verifyToken(token, env.JWT_SECRET || 'default_secret')
  
  if (!decoded) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // 将用户信息添加到请求上下文中
  request.user = decoded
  
  // 调用下一个中间件
  return await next()
}

/**
 * Wrap a request handler with authentication
 * @param {Function} handler - The request handler to wrap
 * @returns {Function} The wrapped handler
 */
export function withAuth(handler) {
  return async (request, env) => {
    return await authMiddleware(request, env, async () => {
      return await handler(request, env)
    })
  }
}