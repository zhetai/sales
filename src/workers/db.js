/**
 * Database access layer for Cloudflare D1
 */

/**
 * Generate a cryptographically secure random ID
 * @param {number} length - Length of the random string to generate
 * @returns {string} A cryptographically secure random string
 */
function generateSecureId(length = 9) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Convert to base36 (0-9, a-z) for consistency with the original format
  return Array.from(array, byte => byte.toString(36).padStart(2, '0')).join('').substring(0, length);
}

/**
 * Initialize the database with tables if they don't exist
 * @param {D1Database} db - The D1 database instance
 * @returns {Promise<void>}
 */
export async function initDatabase(db) {
  try {
    // 检查是否已经存在表
    const { results } = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cooperation_terms'"
    ).all();
    
    // 如果表不存在，则创建表
    if (results.length === 0) {
      // 读取schema.sql文件内容
      // 注意：在实际部署中，这个文件需要在worker中可用
      // 这里我们直接使用SQL语句
      
      const schema = `
        -- 药品代销合作条款表
        CREATE TABLE cooperation_terms (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            affiliate_id TEXT NOT NULL,
            product_ids TEXT NOT NULL,
            cooperation_type TEXT NOT NULL,
            terms TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 权益与责任变更历史表
        CREATE TABLE rights_and_responsibilities_history (
            id TEXT PRIMARY KEY,
            term_id TEXT NOT NULL,
            party TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 合作流程跟踪表
        CREATE TABLE cooperation_process (
            id TEXT PRIMARY KEY,
            term_id TEXT NOT NULL,
            status TEXT NOT NULL,
            next_steps TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 数据共享记录表
        CREATE TABLE data_sharing_records (
            id TEXT PRIMARY KEY,
            term_id TEXT NOT NULL,
            data_type TEXT NOT NULL,
            time_range TEXT NOT NULL,
            access_log TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 达人推荐记录表
        CREATE TABLE influencer_recommendations (
            id TEXT PRIMARY KEY,
            product_type TEXT NOT NULL,
            target_platform TEXT NOT NULL,
            budget_range TEXT NOT NULL,
            recommended_influencers TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 选品策略记录表
        CREATE TABLE product_selection_strategies (
            id TEXT PRIMARY KEY,
            selected_products TEXT NOT NULL,
            data_source TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 用户表
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 达人库表
        CREATE TABLE influencers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            platform TEXT NOT NULL,
            product_type TEXT NOT NULL,
            budget_range TEXT NOT NULL,
            follower_count TEXT NOT NULL,
            conversion_rate TEXT NOT NULL,
            commission_rate TEXT NOT NULL,
            contact TEXT NOT NULL,
            profile_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 创建索引以提高查询性能
        CREATE INDEX idx_cooperation_terms_brand ON cooperation_terms(brand_id);
        CREATE INDEX idx_cooperation_terms_affiliate ON cooperation_terms(affiliate_id);
        CREATE INDEX idx_cooperation_process_term ON cooperation_process(term_id);
        CREATE INDEX idx_data_sharing_term ON data_sharing_records(term_id);
        CREATE INDEX idx_influencer_recommendations_platform ON influencer_recommendations(target_platform);
        CREATE INDEX idx_users_username ON users(username);
        CREATE INDEX idx_influencers_platform ON influencers(platform);
        CREATE INDEX idx_influencers_product_type ON influencers(product_type);
        CREATE INDEX idx_influencers_budget_range ON influencers(budget_range);
      `;
      
      // 执行schema中的所有语句
      const statements = schema.split(';').filter(s => s.trim() !== '');
      for (const statement of statements) {
        if (statement.trim() !== '') {
          await db.prepare(statement).run();
        }
      }
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    // 如果数据库初始化失败，我们继续执行但会记录错误
  }
}

/**
 * Create a new cooperation term
 * @param {D1Database} db - The D1 database instance
 * @param {Object} term - The cooperation term data
 * @returns {Promise<Object>} The created term
 */
export async function createCooperationTerm(db, term) {
  const id = `term_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO cooperation_terms (
      id, brand_id, affiliate_id, product_ids, cooperation_type, terms
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    term.brand_id,
    term.affiliate_id,
    JSON.stringify(term.product_ids),
    term.cooperation_type,
    JSON.stringify(term.terms)
  ).run();
  
  return { id, ...term };
}

/**
 * Get cooperation terms by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - The term ID
 * @returns {Promise<Object|null>} The cooperation term or null if not found
 */
export async function getCooperationTerm(db, id) {
  const term = await db.prepare(`
    SELECT * FROM cooperation_terms WHERE id = ?
  `).bind(id).first();
  
  if (term) {
    term.product_ids = JSON.parse(term.product_ids);
    term.terms = JSON.parse(term.terms);
  }
  
  return term;
}

/**
 * Get cooperation terms by brand ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} brandId - The brand ID
 * @returns {Promise<Array>} Array of cooperation terms
 */
export async function getCooperationTermsByBrand(db, brandId) {
  const { results } = await db.prepare(`
    SELECT * FROM cooperation_terms WHERE brand_id = ?
  `).bind(brandId).all();
  
  return results.map(term => {
    term.product_ids = JSON.parse(term.product_ids);
    term.terms = JSON.parse(term.terms);
    return term;
  });
}

/**
 * Get cooperation terms by affiliate ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} affiliateId - The affiliate ID
 * @returns {Promise<Array>} Array of cooperation terms
 */
export async function getCooperationTermsByAffiliate(db, affiliateId) {
  const { results } = await db.prepare(`
    SELECT * FROM cooperation_terms WHERE affiliate_id = ?
  `).bind(affiliateId).all();
  
  return results.map(term => {
    term.product_ids = JSON.parse(term.product_ids);
    term.terms = JSON.parse(term.terms);
    return term;
  });
}

/**
 * Create a rights and responsibilities history record
 * @param {D1Database} db - The D1 database instance
 * @param {Object} record - The history record data
 * @returns {Promise<Object>} The created record
 */
export async function createRightsHistory(db, record) {
  const id = `history_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO rights_and_responsibilities_history (
      id, term_id, party, action, details
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    record.term_id,
    record.party,
    record.action,
    JSON.stringify(record.details)
  ).run();
  
  return { id, ...record };
}

/**
 * Create a cooperation process record
 * @param {D1Database} db - The D1 database instance
 * @param {Object} process - The process data
 * @returns {Promise<Object>} The created process record
 */
export async function createCooperationProcess(db, process) {
  const id = `process_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO cooperation_process (
      id, term_id, status, next_steps
    ) VALUES (?, ?, ?, ?)
  `).bind(
    id,
    process.term_id,
    process.status,
    JSON.stringify(process.next_steps || [])
  ).run();
  
  return { id, ...process };
}

/**
 * Update a cooperation process record
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - The process ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated process record
 */
export async function updateCooperationProcess(db, id, updates) {
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  await db.prepare(`
    UPDATE cooperation_process 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(...values, id).run();
  
  return await getCooperationProcess(db, id);
}

/**
 * Get a cooperation process record by ID
 * @param {D1Database} db - The D1 database instance
 * @param {string} id - The process ID
 * @returns {Promise<Object|null>} The process record or null if not found
 */
export async function getCooperationProcess(db, id) {
  const process = await db.prepare(`
    SELECT * FROM cooperation_process WHERE id = ?
  `).bind(id).first();
  
  if (process) {
    process.next_steps = JSON.parse(process.next_steps);
  }
  
  return process;
}

/**
 * Create a data sharing record
 * @param {D1Database} db - The D1 database instance
 * @param {Object} record - The data sharing record
 * @returns {Promise<Object>} The created record
 */
export async function createDataSharingRecord(db, record) {
  const id = `data_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO data_sharing_records (
      id, term_id, data_type, time_range, access_log
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    record.term_id,
    record.data_type,
    record.time_range,
    JSON.stringify(record.access_log)
  ).run();
  
  return { id, ...record };
}

/**
 * Create an influencer recommendation record
 * @param {D1Database} db - The D1 database instance
 * @param {Object} record - The recommendation record
 * @returns {Promise<Object>} The created record
 */
export async function createInfluencerRecommendation(db, record) {
  const id = `influencer_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO influencer_recommendations (
      id, product_type, target_platform, budget_range, recommended_influencers
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    record.product_type,
    record.target_platform,
    record.budget_range,
    JSON.stringify(record.recommended_influencers)
  ).run();
  
  return { id, ...record };
}

/**
 * Create a product selection strategy record
 * @param {D1Database} db - The D1 database instance
 * @param {Object} record - The strategy record
 * @returns {Promise<Object>} The created record
 */
export async function createProductSelectionStrategy(db, record) {
  const id = `strategy_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO product_selection_strategies (
      id, selected_products, data_source
    ) VALUES (?, ?, ?)
  `).bind(
    id,
    JSON.stringify(record.selected_products),
    record.data_source
  ).run();
  
  return { id, ...record };
}

/**
 * Create a user
 * @param {D1Database} db - The D1 database instance
 * @param {Object} user - The user data
 * @returns {Promise<Object>} The created user
 */
export async function createUser(db, user) {
  const id = `user_${Date.now()}_${generateSecureId(9)}`;
  
  await db.prepare(`
    INSERT INTO users (
      id, username, password_hash, role
    ) VALUES (?, ?, ?, ?)
  `).bind(
    id,
    user.username,
    user.password_hash,
    user.role
  ).run();
  
  return { id, ...user };
}

/**
 * Get a user by username
 * @param {D1Database} db - The D1 database instance
 * @param {string} username - The username
 * @returns {Promise<Object|null>} The user or null if not found
 */
export async function getUserByUsername(db, username) {
  return await db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).bind(username).first();
}