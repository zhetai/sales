#!/usr/bin/env node

/**
 * GitHub集成MCP服务器
 * 提供GitHub API集成功能，用于创建Issue、PR评论等
 */

import https from 'https';
import { promisify } from 'util';

class GitHubIntegrationMCPServer {
  constructor() {
    this.apiToken = process.env.GITHUB_PAT;
    this.repoOwner = this.extractRepoInfo().owner;
    this.repoName = this.extractRepoInfo().repo;
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * 从环境变量或git配置提取仓库信息
   */
  extractRepoInfo() {
    // 默认值，可以通过环境变量覆盖
    const owner = process.env.GITHUB_REPO_OWNER || 'hongqi3';
    const repo = process.env.GITHUB_REPO_NAME || 'sales';
    
    return { owner, repo };
  }

  /**
   * 发送GitHub API请求
   */
  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          'Authorization': `token ${this.apiToken}`,
          'User-Agent': 'MCP-CI-CD-Agent',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * 创建Issue
   */
  async createIssue(title, body, labels = []) {
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/issues`;
      const data = {
        title,
        body,
        labels
      };

      const response = await this.makeRequest('POST', endpoint, data);
      
      if (response.status === 201) {
        return {
          type: 'issue_created',
          status: 'success',
          issue: response.data,
          url: response.data.html_url
        };
      } else {
        throw new Error(`Failed to create issue: ${response.status}`);
      }
    } catch (error) {
      return {
        type: 'issue_created',
        status: 'failure',
        error: error.message
      };
    }
  }

  /**
   * 创建PR评论
   */
  async createPRComment(prNumber, body) {
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}/comments`;
      const data = { body };

      const response = await this.makeRequest('POST', endpoint, data);
      
      if (response.status === 201) {
        return {
          type: 'pr_comment_created',
          status: 'success',
          comment: response.data,
          url: response.data.html_url
        };
      } else {
        throw new Error(`Failed to create PR comment: ${response.status}`);
      }
    } catch (error) {
      return {
        type: 'pr_comment_created',
        status: 'failure',
        error: error.message
      };
    }
  }

  /**
   * 获取PR信息
   */
  async getPRInfo(prNumber) {
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/pulls/${prNumber}`;
      const response = await this.makeRequest('GET', endpoint);
      
      if (response.status === 200) {
        return {
          type: 'pr_info',
          status: 'success',
          pr: response.data
        };
      } else {
        throw new Error(`Failed to get PR info: ${response.status}`);
      }
    } catch (error) {
      return {
        type: 'pr_info',
        status: 'failure',
        error: error.message
      };
    }
  }

  /**
   * 更新PR状态
   */
  async updatePRStatus(prNumber, state, description = '') {
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/statuses/${prNumber}`;
      const data = {
        state,
        description,
        context: 'MCP CI/CD Agent'
      };

      const response = await this.makeRequest('POST', endpoint, data);
      
      if (response.status === 201) {
        return {
          type: 'pr_status_updated',
          status: 'success',
          statusUpdate: response.data
        };
      } else {
        throw new Error(`Failed to update PR status: ${response.status}`);
      }
    } catch (error) {
      return {
        type: 'pr_status_updated',
        status: 'failure',
        error: error.message
      };
    }
  }

  /**
   * 创建部署状态
   */
  async createDeploymentStatus(sha, state, description, targetUrl = '') {
    try {
      const endpoint = `/repos/${this.repoOwner}/${this.repoName}/deployments`;
      
      // 首先创建deployment
      const deploymentData = {
        ref: sha,
        description: 'MCP CI/CD Deployment'
      };

      const deployResponse = await this.makeRequest('POST', endpoint, deploymentData);
      
      if (deployResponse.status !== 201) {
        throw new Error(`Failed to create deployment: ${deployResponse.status}`);
      }

      // 然后创建deployment status
      const statusEndpoint = `/repos/${this.repoOwner}/${this.repoName}/deployments/${deployResponse.data.id}/statuses`;
      const statusData = {
        state,
        description,
        target_url: targetUrl
      };

      const statusResponse = await this.makeRequest('POST', statusEndpoint, statusData);
      
      if (statusResponse.status === 201) {
        return {
          type: 'deployment_status',
          status: 'success',
          deployment: deployResponse.data,
          statusUpdate: statusResponse.data
        };
      } else {
        throw new Error(`Failed to create deployment status: ${statusResponse.status}`);
      }
    } catch (error) {
      return {
        type: 'deployment_status',
        status: 'failure',
        error: error.message
      };
    }
  }

  /**
   * 格式化报告为Markdown
   */
  formatReportMarkdown(report, type = 'test') {
    const timestamp = new Date().toISOString();
    
    let markdown = `## ${type === 'test' ? '测试' : '代码分析'}报告\n\n`;
    markdown += `**时间**: ${timestamp}\n\n`;
    
    if (type === 'test') {
      markdown += `### 测试结果\n\n`;
      markdown += `- 总数: ${report.summary.total}\n`;
      markdown += `- 通过: ${report.summary.passed}\n`;
      markdown += `- 失败: ${report.summary.failed}\n\n`;
      
      if (report.summary.failed > 0) {
        markdown += `### 失败的测试\n\n`;
        for (const result of report.results) {
          if (result.status === 'failure' && result.testResults?.failures) {
            markdown += `#### ${result.type}\n`;
            for (const failure of result.testResults.failures) {
              markdown += `- ${failure}\n`;
            }
            markdown += '\n';
          }
        }
      }
    } else {
      markdown += `### 分析结果\n\n`;
      markdown += `- 总数: ${report.summary.total}\n`;
      markdown += `- 通过: ${report.summary.passed}\n`;
      markdown += `- 失败: ${report.summary.failed}\n`;
      markdown += `- 错误: ${report.summary.errors}\n\n`;
    }
    
    return markdown;
  }
}

// MCP服务器实现
const server = {
  name: 'github-integration',
  version: '1.0.0',
  
  tools: [
    {
      name: 'create_issue',
      description: '创建GitHub Issue',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Issue标题' },
          body: { type: 'string', description: 'Issue内容' },
          labels: { type: 'array', items: { type: 'string' }, description: 'Issue标签' }
        },
        required: ['title', 'body']
      }
    },
    {
      name: 'create_pr_comment',
      description: '创建PR评论',
      inputSchema: {
        type: 'object',
        properties: {
          pr_number: { type: 'number', description: 'PR编号' },
          body: { type: 'string', description: '评论内容' }
        },
        required: ['pr_number', 'body']
      }
    },
    {
      name: 'get_pr_info',
      description: '获取PR信息',
      inputSchema: {
        type: 'object',
        properties: {
          pr_number: { type: 'number', description: 'PR编号' }
        },
        required: ['pr_number']
      }
    },
    {
      name: 'update_pr_status',
      description: '更新PR状态',
      inputSchema: {
        type: 'object',
        properties: {
          pr_number: { type: 'number', description: 'PR编号' },
          state: { type: 'string', enum: ['pending', 'success', 'failure', 'error'], description: '状态' },
          description: { type: 'string', description: '状态描述' }
        },
        required: ['pr_number', 'state']
      }
    },
    {
      name: 'create_deployment_status',
      description: '创建部署状态',
      inputSchema: {
        type: 'object',
        properties: {
          sha: { type: 'string', description: '提交SHA' },
          state: { type: 'string', enum: ['pending', 'success', 'failure', 'error'], description: '部署状态' },
          description: { type: 'string', description: '描述' },
          target_url: { type: 'string', description: '目标URL' }
        },
        required: ['sha', 'state', 'description']
      }
    },
    {
      name: 'format_report',
      description: '格式化报告为Markdown',
      inputSchema: {
        type: 'object',
        properties: {
          report: { type: 'object', description: '报告数据' },
          type: { type: 'string', enum: ['test', 'analysis'], description: '报告类型' }
        },
        required: ['report']
      }
    }
  ],

  async callTool(name, args) {
    const github = new GitHubIntegrationMCPServer();
    
    switch (name) {
      case 'create_issue':
        return await github.createIssue(args.title, args.body, args.labels || []);
      
      case 'create_pr_comment':
        return await github.createPRComment(args.pr_number, args.body);
      
      case 'get_pr_info':
        return await github.getPRInfo(args.pr_number);
      
      case 'update_pr_status':
        return await github.updatePRStatus(args.pr_number, args.state, args.description);
      
      case 'create_deployment_status':
        return await github.createDeploymentStatus(args.sha, args.state, args.description, args.target_url);
      
      case 'format_report':
        return {
          type: 'formatted_report',
          markdown: github.formatReportMarkdown(args.report, args.type)
        };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
};

// 启动MCP服务器
if (require.main === module) {
  console.log(JSON.stringify(server));
} else {
  module.exports = server;
}
