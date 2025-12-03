# Sales Proxy Project

This is a Cloudflare Worker application for managing pharmaceutical distribution partnerships with a responsive dashboard.

## Project Overview

- **Name**: Sales Proxy
- **Platform**: Cloudflare Workers with Astro frontend
- **Primary Domain**: https://salesproxy.518166.com.cn/
- **Worker URL**: https://sales-proxy.zd261998.workers.dev

## Key Features

1. **API Management System**:
   - Cooperation Terms Configuration
   - Rights and Responsibilities Management
   - Cooperation Process Tracking
   - Data Sharing Portal

2. **Dashboard**:
   - Key performance indicators (KPIs)
   - Data visualization
   - Permission management
   - Alert system

3. **Responsive Design**:
   - Mobile-first approach
   - Adaptive layouts for all screen sizes
   - Touch-friendly interface

## Recent Improvements

### Performance Optimization (October 2025)
- Implemented caching mechanism in Cloudflare Worker for static assets with 5-minute TTL
- Added request debouncing to dashboard filters to prevent excessive API calls
- Implemented timeout controls for API requests to prevent hanging connections
- Enabled parallel loading of dashboard modules for improved performance
- Added optimized build configuration with asset compression and HTML minification
- Reduced Worker bundle size by ~34% (from 72.40 KiB to 48.03 KiB)

### Enhanced Data Visualization (October 2025)
- Integrated Chart.js library for interactive charts
- Replaced placeholder chart content with actual visualizations
- Added support for line charts, bar charts, and pie charts
- Improved chart responsiveness and styling

### Enhanced Responsive Design (October 2025)
- Improved grid layouts for metrics, charts, and alerts
- Better handling of small screens
- Enhanced flexbox usage for more consistent sizing

### Dedicated Video Editor Page (October 2025)
- Created a standalone route for the intelligent clipping feature at `/video-editor`
- Added direct navigation link in the main navigation menu
- Implemented a user-friendly interface for video processing with剪映「智能成片」WASM
- Integrated with existing API endpoints for video processing

### Chart Testing Page (October 2025)
- Created a standalone route for chart testing at `/chart-test`
- Implemented test cases for all chart types (line, bar, pie)
- Verified Chart.js integration and functionality
- Confirmed proper rendering of data visualizations

### Script Generator Page (October 2025)
- Created a standalone route for video script generation at `/script-generator`
- Implemented user-friendly interface for the 药品代销短视频内容脚本生成接口
- Added navigation link in the main navigation menu
- Integrated with existing API endpoint `/api/generate-video-script`

### Traffic Operation Page (October 2025)
- Created a standalone route for traffic operation management at `/traffic-operation`
- Implemented comprehensive interface for pharmaceutical affiliate marketing operations
- Added navigation link in the main navigation menu with title "综合运营策略配置"
- Fixed routing issue that was causing "Invalid module name" errors for traffic operation buttons
- Integrated with existing API endpoints for chanmama ad placement, jietiao smart clipping, influencer recommendation, and publish schedule webhook

### Risk Control and After-sales Page (October 2025)
- Created a standalone route for risk control and after-sales management at `/risk-control`
- Implemented comprehensive interface for pharmaceutical risk control and after-sales operations
- Added navigation link in the main navigation menu with title "风控与售后管理"
- Integrated with new API endpoint `/api/risk-control-and-after-sales` for content audit, pharmacist transfer, wechat notification, and return review

### Data Operation Metrics Page (October 2025)
- Created a standalone route for data-driven operation metrics management at `/data-operation`
- Implemented comprehensive interface for operation indicator query, dashboard configuration generation, and real-time indicator push
- Added navigation link in the main navigation menu with title "数据化运营"
- Integrated with new API endpoint `/api/data-operation-dashboard` for indicator query, dashboard config generation, and real-time push

### Cooperation Model Page (October 2025)
- Created a standalone route for pharmaceutical affiliate cooperation model management at `/cooperation-model`
- Implemented comprehensive interface for cooperation term configuration, rights and responsibilities management, cooperation process tracking, and data sharing
- Added navigation link in the main navigation menu with title "合作模式"
- Integrated with new API endpoint `/api/cooperation-model` for all cooperation management modules

### Dashboard as Default Page (October 2025)
- Set the dashboard as the default landing page for improved user experience
- Replaced the generic Astro welcome page with a fully functional dashboard
- Implemented key performance indicators (KPIs), data visualization, and alert system
- Added filtering capabilities for time range, platform, and product type

### Enhanced Cooperation Management Navigation (October 2025)
- Added navigation tabs to the cooperation management page
- Created easy access between cooperation terms management and cooperation model management
- Implemented intuitive tab-based navigation for related features

### Hidden Cooperation Model Link in Top Navigation (October 2025)
- Hidden the '合作模式' link in the top navigation bar for cleaner UI
- Maintained access to cooperation model functionality through cooperation page navigation
- Added CSS utility class for hiding navigation elements
- Additional breakpoints for better device support
- Improved text truncation for small screens
- Better form element sizing on mobile

### Software Copyright Application (October 2025)
- Prepared software copyright application materials including source code excerpts and documentation
- Created COPYRIGHT.md file with detailed software information
- Generated program and document identification materials for copyright registration
- Organized all necessary files for submission to the copyright office

## API Endpoints

### Core Modules
1. `/api/operation_indicator_query` - Query operational indicators
2. `/api/dashboard_config_generator` - Generate dashboard configurations
3. `/api/real_time_indicator_push` - Push real-time indicators
4. `/api/cooperation_term_configuration` - Configure cooperation terms
5. `/api/rights_and_responsibilities_manager` - Manage rights and responsibilities
6. `/api/cooperation_process_tracker` - Track cooperation processes
7. `/api/data_sharing_portal` - Share data between parties
8. `/api/chanmama_ad_placement` - 千川投放接口（ROI基准线管控）
9. `/api/jietiao_smart_clipping` - 剪映智能剪辑WASM处理（多版本生成+完播率筛选）
10. `/api/influencer_recommendation` - 符合"带货条件"的达人推荐列表
11. `/api/publish_schedule_webhook` - 平台发布时间及主子账号微信通知
12. `/api/drug-selection-strategy` - 药品代销短视频带货选品策略配置（GET请求）
13. `/api/generate-video-script` - 药品代销短视频内容脚本生成接口（POST请求）
14. `/api/traffic-operation` - 药品代销短视频流量运营综合接口（POST请求）
15. `/api/risk-control-and-after-sales` - 药品代销风控与售后综合接口（POST请求）
16. `/api/data-operation-dashboard` - 药品代销数据化运营指标综合接口（POST请求）
17. `/api/cooperation-model` - 药品代销合作模式管理综合接口（POST请求）

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
- `/cooperation-model` - Cooperation model management page

## Deployment

### Requirements
- Node.js 18+
- Cloudflare account with Workers subscription
- Cloudflare API token with Workers permissions

### Commands
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build (standard)
npm run build

# Build (optimized)
npm run build:optimized

# Deploy (standard)
CLOUDFLARE_API_TOKEN=your_token npm run deploy

# Deploy (optimized)
CLOUDFLARE_API_TOKEN=your_token npm run deploy:optimized
```

### Performance Optimized Deployment
The optimized deployment includes:
- Asset compression and minification
- Smart placement of Workers closer to users
- Caching strategies for static assets
- Reduced bundle size for faster loading

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

### Wrangler Configuration
The `wrangler.jsonc` file contains the Cloudflare Workers configuration:
- Worker name: `sales-proxy`
- Main entrypoint: `worker.js`
- Assets directory: `dist/`
- Compatibility date: `2025-10-08`

## Traffic Operation Modules

### Drug Affiliate Traffic Operation API
Supports comprehensive short video traffic operations for pharmaceutical distribution partnerships, including:
- Chanmama ad placement with ROI control
- Jietiao smart clipping with WASM processing
- Influencer recommendations
- Scheduled publishing with WeChat notifications

### Module Details

#### 1. Chanmama Ad Placement (`chanmama_ad_placement`)
- **Description**: 千川投放接口（ROI基准线管控）
- **Function**: Handles ad placement on Chanmama platform with ROI baseline control
- **Key Features**:
  - Compliance validation for pharmaceutical advertising
  - ROI prediction based on product category
  - Ad plan generation with targeting and budget allocation
  - Risk warnings for low ROI predictions

#### 2. Jietiao Smart Clipping (`jietiao_smart_clipping`)
- **Description**: 剪映智能剪辑WASM处理（多版本生成+完播率筛选）
- **Function**: Processes videos using剪映智能成片WASM module
- **Key Features**:
  - WASM module loading for剪映智能成片 functionality
  - Multi-version generation with different editing styles
  - Completion rate filtering using Chanmama API
  - High completion rate video selection

#### 3. Influencer Recommendation (`influencer_recommendation`)
- **Description**: 符合"带货条件"的达人推荐列表
- **Function**: Recommends suitable influencers for product promotion
- **Key Features**:
  - Influencer database filtering based on historical data
  - Product-category and platform matching
  - Compliance validation to exclude违规recorded influencers
  - Ranking by conversion rate and audience precision

#### 4. Publish Schedule Webhook (`publish_schedule_webhook`)
- **Description**: 平台发布时间及主子账号微信通知
- **Function**: Schedules video publishing and sends WeChat notifications
- **Key Features**:
  - Platform API integration for scheduled publishing
  - Status monitoring for publish results
  - WeChat notifications via Webhook (Server酱, 企业微信, etc.)

## Risk Control Modules

### Drug Affiliate Risk Control and After-sales API
Supports comprehensive risk control and after-sales management for pharmaceutical distribution partnerships, including:
- Tencent Cloud medical content audit
- Compliant pharmacist transfer
- Drug registration WeChat notifications
- Return and refund auto review

### Module Details

#### 1. Tencent Cloud Medical Content Audit (`tencent_cloud_medical_content_audit`)
- **Description**: 调用腾讯云「医药内容审核工具」进行内容合规性校验
- **Function**: Validates content compliance using Tencent Cloud medical content review tool
- **Key Features**:
  - Content preprocessing to extract sensitive words and违规表述
  - Integration with Tencent Cloud medical audit API
  - Standardized violation mapping for business-readable descriptions
  - Risk classification (low/medium/high) for appropriate actions

#### 2. Compliant Pharmacist Transfer (`compliant_pharmacist_transfer`)
- **Description**: 转接第三方合规在线药师（支持文字/语音咨询）
- **Function**: Transfers user inquiries to third-party compliant pharmacists
- **Key Features**:
  - Question classification using NLP models
  - Compliance filtering to prevent medical violations
  - Integration with third-party pharmacist platforms
  - Status tracking for pharmacist responses

#### 3. Drug Registration WeChat Notification (`drug_registration_wechat_notification`)
- **Description**: Webhook微信通知代销药品报备状态（适配药监平台要求）
- **Function**: Sends WeChat notifications for drug registration status
- **Key Features**:
  - Formatted notification content for readability
  - Integration with WeChat webhook services
  - Status confirmation for sent notifications

#### 4. Return and Refund Auto Review (`return_refund_auto_review`)
- **Description**: 退换货及退款自动审核（基于规则引擎）
- **Function**: Automatically reviews returns and refunds based on rule engine
- **Key Features**:
  - Rule-based decision making for different product types
  - Compliance validation for return policies
  - Automated actions for approved/rejected requests
  - Audit trail for regulatory compliance

## Cooperation Model Modules

### Drug Affiliate Cooperation Model API
Supports comprehensive cooperation model management for pharmaceutical distribution partnerships, including:
- Cooperation term configuration
- Rights and responsibilities management
- Cooperation process tracking
- Data sharing between parties

### Module Details

#### 1. Cooperation Term Configuration (`cooperation_term_configuration`)
- **Description**: 合作基础条款配置（品牌方主导，代销方确认）
- **Function**: Configures basic cooperation terms between brand and affiliate parties
- **Key Features**:
  - Compliance validation: Automatically validates mandatory fields for pharmaceutical cooperation (e.g., qualification sharing, content audit responsibility)
  - Structured storage: Converts commission, inventory, after-sales rules into JSON for automated execution
  - Blockchain notarization: Stores signed contracts on blockchain to ensure terms are tamper-proof

#### 2. Rights and Responsibilities Manager (`rights_and_responsibilities_manager`)
- **Description**: 权益与责任动态管理（支持条款变更与争议仲裁）
- **Function**: Manages rights and responsibilities dynamically with change management and dispute resolution
- **Key Features**:
  - Dynamic changes: Supports online modification of terms (e.g., adjusting commission rates) with counterparty confirmation
  - Dispute arbitration: Integrates third-party arbitration interface for unresolved disputes
  - Version management: Saves all change history for accountability

#### 3. Cooperation Process Tracker (`cooperation_process_tracker`)
- **Description**: 合作流程全链路跟踪（从签约到结算）
- **Function**: Tracks cooperation processes throughout the entire lifecycle from signing to settlement
- **Key Features**:
  - State machine management: Defines full process states from "signed" to "settled" to prevent invalid operations
  - Task reminders: Pushes task reminders during process changes to reduce communication costs
  - Data archiving: Archives full process data after settlement for regulatory compliance

#### 4. Data Sharing Portal (`data_sharing_portal`)
- **Description**: 合作数据共享接口（品牌方与代销方双向查看）
- **Function**: Enables bidirectional data sharing between brand and affiliate parties
- **Key Features**:
  - Access control: Restricts data access by role (e.g., affiliates can view sales data but not costs)
  - Data anonymization: Hides sensitive information (e.g., user phone numbers, purchase prices)
  - Active push: Proactively notifies both parties of critical data (e.g., inventory warnings)

## Data Operation Modules

### Drug Affiliate Data Operation Dashboard API
Supports comprehensive data-driven operation metrics for pharmaceutical distribution partnerships, including:
- Multi-dimensional operation indicator query
- Visualization dashboard configuration generation
- Real-time indicator push with anomaly detection

### Module Details

#### 1. Operation Indicator Query (`operation_indicator_query`)
- **Description**: 多维度运营指标查询（覆盖流量、转化、商品、用户、风控）
- **Function**: Queries multi-dimensional operation indicators across traffic, conversion, product, user, and risk dimensions
- **Key Features**:
  - Multi-dimensional filtering by time range, platform, and product type
  - Coverage of five key dimensions: traffic (play count), conversion (conversion rate, ROI), product (return rate, price), user (repurchase rate), risk (negative review rate)
  - Drill-down functionality to item/creator details (e.g., viewing negative review reasons for a specific product, fan conversion efficiency for a specific creator)

#### 2. Dashboard Config Generator (`dashboard_config_generator`)
- **Description**: 可视化仪表盘配置生成（支持自定义图表与布局）
- **Function**: Generates visualization dashboard configurations with customizable charts and layouts
- **Key Features**:
  - Customizable chart types: line charts, bar charts, pie charts, tables to meet different visualization needs
  - Layout optimization: Automatically adjusts layout based on number of charts (e.g., 2-column grid, full-screen single chart) for improved readability
  - Interactive binding: Adds default filters (time, platform) and drill-down functionality

#### 3. Real-time Indicator Push (`real_time_indicator_push`)
- **Description**: 关键指标实时推送（Webhook通知异常波动）
- **Function**: Pushes real-time notifications for key indicator anomalies via Webhook
- **Key Features**:
  - Threshold monitoring: Periodically checks key indicators (e.g., return rate, ROI) and pushes alerts when thresholds are triggered
  - Reason inference: Provides reasons for fluctuations based on historical data (e.g., "Some users reported stomach discomfort") to assist quick decision-making
  - Status receipt: Records push results to ensure alerts are not missed

#### 5. Drug Selection Strategy (`drug-selection-strategy`)
- **Description**: 药品代销短视频带货选品策略配置
- **Function**: Provides product selection strategy for pharmaceutical affiliate marketing
- **Key Features**:
  - Public opinion monitoring to filter out high-risk products
  - Hot trend borrowing from platforms like Douyin
  - Data verification using metrics like conversion rate and return rate
  - Profit calculation to ensure adequate margins
  - Reverse selection logic based on public opinion and data filtering
- **Request Method**: GET
- **Endpoint**: `/api/drug-selection-strategy`

#### 6. Video Script Generation (`generate-video-script`)
- **Description**: 药品代销短视频内容脚本生成接口
- **Function**: Generates compliant and high-conversion Markdown script templates
- **Key Features**:
  - Compliance validation based on product type
  - Template-based script generation with variable replacement
  - SOP adaptation for different product types
  - Automatic addition of compliance warnings
  - Optimization suggestions based on product type
- **Request Method**: POST
- **Endpoint**: `/api/generate-video-script`

#### 9. Data Operation Dashboard (`data-operation-dashboard`)
- **Description**: 药品代销数据化运营指标综合接口
- **Function**: Comprehensive API endpoint for managing data-driven operation metrics
- **Key Features**:
  - Multi-dimensional operation indicator query (traffic, conversion, product, user, risk)
  - Visualization dashboard configuration generation with customizable charts
  - Real-time indicator push with webhook notifications for anomaly detection
- **Request Method**: POST
- **Endpoint**: `/api/data-operation-dashboard`

#### 10. Cooperation Model (`cooperation-model`)
- **Description**: 药品代销合作模式管理综合接口
- **Function**: Comprehensive API endpoint for managing pharmaceutical affiliate cooperation models
- **Key Features**:
  - Cooperation term configuration with brand and affiliate parties
  - Rights and responsibilities management with dispute resolution
  - Cooperation process tracking from signing to settlement
  - Data sharing between brand and affiliate with access control
- **Request Method**: POST
- **Endpoint**: `/api/cooperation-model`

## Troubleshooting

### Common Issues
1. **405 Method Not Allowed**: Ensure API endpoints are accessed with POST requests
2. **304 Not Modified**: Cache control headers have been added to prevent caching issues
3. **Deployment timeouts**: Network issues may cause deployment to timeout; retry if necessary

### Testing
- Verify API endpoints with curl or Postman
- Check dashboard responsiveness on different devices
- Test all form submissions and interactions

## Development Notes

### Code Structure
- `worker.js` - Main Cloudflare Worker implementation
- `src/pages/` - Astro frontend pages
- `src/components/` - Reusable UI components
- `dist/` - Built assets for deployment
- `public/` - Static assets

### Responsive Design Features
- CSS Grid and Flexbox layouts
- Media queries for multiple breakpoints
- Mobile-first approach
- Adaptive component sizing
- Touch-friendly interactions