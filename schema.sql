-- 药品代销合作条款表
CREATE TABLE cooperation_terms (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    affiliate_id TEXT NOT NULL,
    product_ids TEXT NOT NULL, -- JSON array of product IDs
    cooperation_type TEXT NOT NULL,
    terms TEXT NOT NULL, -- JSON object of terms
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权益与责任变更历史表
CREATE TABLE rights_and_responsibilities_history (
    id TEXT PRIMARY KEY,
    term_id TEXT NOT NULL,
    party TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL, -- JSON object of change details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 合作流程跟踪表
CREATE TABLE cooperation_process (
    id TEXT PRIMARY KEY,
    term_id TEXT NOT NULL,
    status TEXT NOT NULL,
    next_steps TEXT, -- JSON array of next steps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据共享记录表
CREATE TABLE data_sharing_records (
    id TEXT PRIMARY KEY,
    term_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    time_range TEXT NOT NULL,
    access_log TEXT NOT NULL, -- JSON array of access logs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 达人推荐记录表
CREATE TABLE influencer_recommendations (
    id TEXT PRIMARY KEY,
    product_type TEXT NOT NULL,
    target_platform TEXT NOT NULL,
    budget_range TEXT NOT NULL,
    recommended_influencers TEXT NOT NULL, -- JSON array of recommended influencers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 选品策略记录表
CREATE TABLE product_selection_strategies (
    id TEXT PRIMARY KEY,
    selected_products TEXT NOT NULL, -- JSON array of selected products
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