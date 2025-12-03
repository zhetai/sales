# Sales Proxy Usage Guide

## Overview

Sales Proxy is a Cloudflare Worker application for managing pharmaceutical distribution partnerships with a responsive dashboard. The application provides a comprehensive set of tools for managing cooperation terms, tracking processes, sharing data, and optimizing marketing operations.

## Prerequisites

Before using Sales Proxy, ensure you have:
- Node.js 18+
- A Cloudflare account with Workers subscription
- Cloudflare API token with Workers permissions

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sales-proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server:

```bash
npm run dev
```

This will start a local development server at `localhost:4321`.

## Building

### Standard Build

```bash
npm run build
```

### Optimized Build

For production deployment with asset compression and minification:

```bash
npm run build:optimized
```

## Deployment

### Standard Deployment

```bash
CLOUDFLARE_API_TOKEN=your_token npm run deploy
```

### Optimized Deployment

```bash
CLOUDFLARE_API_TOKEN=your_token npm run deploy:optimized
```

## Project Structure

```
sales-proxy/
├── src/
│   ├── pages/           # Astro frontend pages
│   ├── components/      # Reusable UI components
│   ├── layouts/         # Page layouts
│   └── lib/             # Utility functions
├── worker.js           # Main Cloudflare Worker implementation
├── dist/               # Built assets for deployment
└── public/             # Static assets
```

## Key Features

### 1. Dashboard
The main dashboard provides an overview of key performance indicators, data visualizations, and system alerts.

Access: `/` (default landing page)

### 2. API Management System
- **Cooperation Terms Configuration**: Set up and manage cooperation agreements
- **Rights and Responsibilities Management**: Define and manage roles and permissions
- **Cooperation Process Tracking**: Monitor the lifecycle of partnerships
- **Data Sharing Portal**: Secure data exchange between parties

### 3. Traffic Operation Modules
Supports comprehensive short video traffic operations for pharmaceutical distribution partnerships:

#### Chanmama Ad Placement
Handles ad placement on Chanmama platform with ROI baseline control.

#### Jietiao Smart Clipping
Processes videos using 剪映智能成片 WASM module for multi-version generation and completion rate filtering.

#### Influencer Recommendation
Recommends suitable influencers for product promotion based on historical data and compliance validation.

#### Publish Schedule Webhook
Schedules video publishing and sends WeChat notifications.

### 4. Risk Control Modules
Comprehensive risk control and after-sales management:

#### Tencent Cloud Medical Content Audit
Validates content compliance using Tencent Cloud medical content review tool.

#### Compliant Pharmacist Transfer
Transfers user inquiries to third-party compliant pharmacists.

#### Drug Registration WeChat Notification
Sends WeChat notifications for drug registration status.

#### Return and Refund Auto Review
Automatically reviews returns and refunds based on rule engine.

### 5. Cooperation Model Modules
Manage pharmaceutical affiliate cooperation models:

#### Cooperation Term Configuration
Configure basic cooperation terms between brand and affiliate parties.

#### Rights and Responsibilities Manager
Manage rights and responsibilities dynamically with change management.

#### Cooperation Process Tracker
Track cooperation processes throughout the entire lifecycle.

#### Data Sharing Portal
Enable bidirectional data sharing between brand and affiliate parties.

### 6. Data Operation Modules
Data-driven operation metrics for pharmaceutical distribution partnerships:

#### Operation Indicator Query
Query multi-dimensional operation indicators across traffic, conversion, product, user, and risk dimensions.

#### Dashboard Config Generator
Generate visualization dashboard configurations with customizable charts.

#### Real-time Indicator Push
Push real-time notifications for key indicator anomalies via Webhook.

## API Endpoints

### Core Modules
- `/api/operation_indicator_query` - Query operational indicators
- `/api/dashboard_config_generator` - Generate dashboard configurations
- `/api/real_time_indicator_push` - Push real-time indicators
- `/api/cooperation_term_configuration` - Configure cooperation terms
- `/api/rights_and_responsibilities_manager` - Manage rights and responsibilities
- `/api/cooperation_process_tracker` - Track cooperation processes
- `/api/data_sharing_portal` - Share data between parties
- `/api/chanmama_ad_placement` - 千川投放接口（ROI基准线管控）
- `/api/jietiao_smart_clipping` - 剪映智能剪辑WASM处理（多版本生成+完播率筛选）
- `/api/influencer_recommendation` - 符合"带货条件"的达人推荐列表
- `/api/publish_schedule_webhook` - 平台发布时间及主子账号微信通知
- `/api/drug-selection-strategy` - 药品代销短视频带货选品策略配置（GET请求）
- `/api/generate-video-script` - 药品代销短视频内容脚本生成接口（POST请求）
- `/api/traffic-operation` - 药品代销短视频流量运营综合接口（POST请求）
- `/api/risk-control-and-after-sales` - 药品代销风控与售后综合接口（POST请求）
- `/api/data-operation-dashboard` - 药品代销数据化运营指标综合接口（POST请求）
- `/api/cooperation-model` - 药品代销合作模式管理综合接口（POST请求）

### Testing Endpoints
- `/api-test` - API testing page
- `/dashboard` - Main dashboard
- `/video-editor` - 智能剪辑工具页面
- `/cooperation` - Cooperation management
- `/login` - Login page
- `/reports` - Reports page
- `/settings` - Settings page
- `/traffic-operation` - Traffic operation management page
- `/risk-control` - Risk control and after-sales management page
- `/data-operation` - Data operation metrics management page
- `/cooperation-model` - Cooperation model management page

## Configuration

### Environment Variables
- `CLOUDFLARE_API_TOKEN` - Required for deployment
- `BLOCKCHAIN_SERVICE_URL` - Blockchain service endpoint
- `ARBITRATION_SERVICE_URL` - Arbitration service endpoint
- `SIGNATURE_PLATFORM_KEY` - Digital signature platform key
- `CHANMAMA_API_KEY` - 千川API密钥
- `JIETIAO_WASM_URL` - 剪映WASM模块地址
- `INFLUENCER_DB_URL` - 达人库数据库URL
- `WECHAT_WEBHOOK_SECRET` - 微信Webhook密钥
- `BQYUN_API_KEY` - 清博舆情API密钥
- `TENCENT_CLOUD_MEDICAL_API_KEY` - 腾讯云医药审核API密钥
- `PHARMACIST_PLATFORM_URL` - 第三方药师平台接口URL
- `RETURN_REFUND_RULE_ENGINE` - 退换货规则引擎配置（JSON格式）
- `INFLUENCER_API_KEY` - 达人库API密钥

## Performance Optimization

The application includes several performance optimizations:
- Caching mechanism in Cloudflare Worker for static assets with 5-minute TTL
- Request debouncing to dashboard filters to prevent excessive API calls
- Timeout controls for API requests to prevent hanging connections
- Parallel loading of dashboard modules for improved performance
- Asset compression and HTML minification in optimized builds
- Reduced Worker bundle size (~34% reduction)

## Responsive Design

The application follows a mobile-first approach with:
- CSS Grid and Flexbox layouts
- Media queries for multiple breakpoints
- Adaptive component sizing
- Touch-friendly interactions

## Data Sources and Integration

### Current Data Implementation
The dashboard now supports both mock data and real-time data integration:
- **Influencer Recommendations**: Supports real-time data from influencer databases with fallback to mock data
- **Product Recommendations**: Supports real-time data from舆情监控and sales data APIs with fallback to mock data

### Making Data Real and Up-to-Date

To connect the application to live data sources:

1. **Integrate with Real Data APIs**:
   - Set up accounts with 清博舆情系统 and 蝉妈妈 data services
   - Obtain proper API credentials from these services

2. **Configure Environment Variables**:
   - Update the following environment variables in your Cloudflare Worker:
     - `CHANMAMA_API_KEY` - 蝉妈妈API密钥
     - `BQYUN_API_KEY` - 清博舆情API密钥
     - `INFLUENCER_DB_URL` - 达人库数据库URL
     - `INFLUENCER_API_KEY` - 达人库API密钥
   - The application will automatically use real data when these variables are set

3. **Data Integration Points**:
   - **舆情监控系统**: Integrates with 腾讯云NLP情感分析 for real-time sentiment analysis
   - **多平台投放管理**: Supports both 微信小店 and 抖音小店 APIs for cross-platform promotion
   - **智能选品引擎**: Uses weighted轮询策略 with real-time sales and舆情data
   - **达人推荐系统**: Implements 协同过滤+规则过滤 algorithms with compliance scoring

4. **Error Handling and Fallback**:
   - The application includes robust error handling with automatic fallback to mock data
   - Monitoring and alerting for data integration issues
   - Graceful degradation when external services are unavailable

## Troubleshooting

### Common Issues
1. **405 Method Not Allowed**: Ensure API endpoints are accessed with POST requests
2. **304 Not Modified**: Cache control headers have been added to prevent caching issues
3. **Deployment timeouts**: Network issues may cause deployment to timeout; retry if necessary

### Testing
- Verify API endpoints with curl or Postman
- Check dashboard responsiveness on different devices
- Test all form submissions and interactions