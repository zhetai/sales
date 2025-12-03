# GitHub Secrets 配置指南

## 必需的 GitHub Secrets

请在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 Secrets：

### 1. LLM API 密钥
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
- 用于 Claude 3.5 Sonnet API 调用
- 从 https://console.anthropic.com 获取

### 2. GitHub Personal Access Token
```
GITHUB_PAT=your_github_pat_here
```
- 用于创建 Issue 和 PR 评论
- 权限需要：`repo`, `workflow:write`
- 从 https://github.com/settings/tokens 生成

### 3. Cloudflare API Token
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```
- 用于 Cloudflare Workers 部署
- 权限需要：`Account:Cloudflare Edit:Read`, `Zone:Zone:Read`, `User:User Details:Read`

## 可选的 GitHub Secrets

### 4. 报告通知 Webhook
```
REPORT_WEBHOOK_URL=your_webhook_url_here
```
- 用于发送 CI/CD 报告到外部系统（如 Slack、Teams）

### 5. MCP 服务器认证
```
MCP_AUTH_TOKEN=your_mcp_auth_token_here
```
- 用于 MCP 服务器间的认证

## 配置步骤

1. 访问 GitHub 仓库页面
2. 点击 Settings > Secrets and variables > Actions
3. 点击 "New repository secret"
4. 添加上述每个 Secret
5. 确保在 Workflow 中正确引用这些 Secrets

## 安全注意事项

- 所有 Secret 都经过 GitHub 加密存储
- 定期轮换 API 密钥和 PAT
- 限制 PAT 的最小必要权限
- 不要在代码中硬编码任何敏感信息