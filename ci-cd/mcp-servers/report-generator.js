#!/usr/bin/env node

/**
 * 报告生成MCP服务器
 * 提供报告生成、格式化、输出功能
 */

import fs from 'fs/promises';
import path from 'path';

class ReportGeneratorMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportsDir = path.join(this.projectRoot, 'ci-cd', 'reports');
    this.ensureReportsDir();
  }

  /**
   * 确保报告目录存在
   */
  async ensureReportsDir() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  }

  /**
   * 生成综合测试报告
   */
  async generateTestReport(testResults, coverage = null) {
    const timestamp = new Date().toISOString();
    const report = {
      type: 'test',
      timestamp,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'success').length,
        failed: testResults.filter(r => r.status === 'failure').length,
        errors: testResults.filter(r => r.status === 'error').length
      },
      coverage,
      results: testResults,
      recommendations: this.generateTestRecommendations(testResults, coverage)
    };

    return await this.saveReport(report, 'test');
  }

  /**
   * 生成代码分析报告
   */
  async generateCodeAnalysisReport(analysisResults) {
    const timestamp = new Date().toISOString();
    const report = {
      type: 'code-analysis',
      timestamp,
      summary: {
        total: analysisResults.length,
        passed: analysisResults.filter(r => r.status === 'success').length,
        failed: analysisResults.filter(r => r.status === 'failure').length,
        errors: analysisResults.filter(r => r.status === 'error').length
      },
      results: analysisResults,
      recommendations: this.generateAnalysisRecommendations(analysisResults)
    };

    return await this.saveReport(report, 'analysis');
  }

  /**
   * 生成部署报告
   */
  async generateDeploymentReport(deploymentResults, buildInfo = {}) {
    const timestamp = new Date().toISOString();
    const report = {
      type: 'deployment',
      timestamp,
      buildInfo,
      summary: {
        total: deploymentResults.length,
        successful: deploymentResults.filter(r => r.status === 'success').length,
        failed: deploymentResults.filter(r => r.status === 'failure').length
      },
      results: deploymentResults
    };

    return await this.saveReport(report, 'deployment');
  }

  /**
   * 生成HTML报告
   */
  async generateHTMLReport(reportData) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportData.type === 'test' ? '测试' : '代码分析'}报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .success { background: #d5f4e6; color: #27ae60; }
        .failure { background: #fbecec; color: #e74c3c; }
        .error { background: #fef5e7; color: #f39c12; }
        .results { margin-top: 20px; }
        .result-item { border: 1px solid #ddd; margin-bottom: 10px; border-radius: 5px; }
        .result-header { background: #f8f9fa; padding: 10px 15px; font-weight: bold; border-bottom: 1px solid #ddd; }
        .result-content { padding: 15px; }
        .recommendations { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.type === 'test' ? '测试' : '代码分析'}报告</h1>
            <p>生成时间: ${reportData.timestamp}</p>
        </div>
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>总数</h3>
                    <p style="font-size: 2em; margin: 0;">${reportData.summary.total}</p>
                </div>
                <div class="summary-card ${reportData.summary.passed > 0 ? 'success' : ''}">
                    <h3>通过</h3>
                    <p style="font-size: 2em; margin: 0;">${reportData.summary.passed}</p>
                </div>
                <div class="summary-card ${reportData.summary.failed > 0 ? 'failure' : ''}">
                    <h3>失败</h3>
                    <p style="font-size: 2em; margin: 0;">${reportData.summary.failed}</p>
                </div>
                <div class="summary-card ${reportData.summary.errors > 0 ? 'error' : ''}">
                    <h3>错误</h3>
                    <p style="font-size: 2em; margin: 0;">${reportData.summary.errors}</p>
                </div>
            </div>
            
            ${reportData.coverage ? `
            <div class="coverage">
                <h2>代码覆盖率</h2>
                <div class="summary">
                    <div class="summary-card">
                        <h3>语句</h3>
                        <p style="font-size: 1.5em; margin: 0;">${reportData.coverage.statements}%</p>
                    </div>
                    <div class="summary-card">
                        <h3>分支</h3>
                        <p style="font-size: 1.5em; margin: 0;">${reportData.coverage.branches}%</p>
                    </div>
                    <div class="summary-card">
                        <h3>函数</h3>
                        <p style="font-size: 1.5em; margin: 0;">${reportData.coverage.functions}%</p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="results">
                <h2>详细结果</h2>
                ${reportData.results.map(result => `
                <div class="result-item">
                    <div class="result-header">
                        ${result.type} - ${result.status}
                    </div>
                    <div class="result-content">
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    </div>
                </div>
                `).join('')}
            </div>
            
            ${reportData.recommendations ? `
            <div class="recommendations">
                <h2>建议</h2>
                <ul>
                    ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

    const filename = `${reportData.type}-report-${Date.now()}.html`;
    const filepath = path.join(this.reportsDir, filename);
    await fs.writeFile(filepath, htmlTemplate);

    return {
      type: 'html_report',
      filepath,
      filename,
      url: `file://${filepath}`
    };
  }

  /**
   * 保存报告到文件
   */
  async saveReport(report, type) {
    await this.ensureReportsDir();
    
    const filename = `${type}-report-${Date.now()}.json`;
    const filepath = path.join(this.reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return {
      type: 'report_saved',
      filepath,
      filename,
      report
    };
  }

  /**
   * 生成测试建议
   */
  generateTestRecommendations(testResults, coverage) {
    const recommendations = [];
    
    if (testResults.some(r => r.status === 'failure')) {
      recommendations.push('存在失败的测试用例，请检查并修复');
    }
    
    if (coverage) {
      if (coverage.statements < 80) {
        recommendations.push('语句覆盖率低于80%，建议增加测试用例');
      }
      if (coverage.branches < 70) {
        recommendations.push('分支覆盖率较低，建议测试更多分支路径');
      }
      if (coverage.functions < 80) {
        recommendations.push('函数覆盖率低于80%，确保所有函数都有测试');
      }
    }
    
    const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    if (totalDuration > 300000) { // 5分钟
      recommendations.push('测试执行时间较长，考虑优化测试性能');
    }
    
    return recommendations;
  }

  /**
   * 生成代码分析建议
   */
  generateAnalysisRecommendations(analysisResults) {
    const recommendations = [];
    
    const eslintResult = analysisResults.find(r => r.type === 'eslint');
    if (eslintResult && eslintResult.errors.length > 0) {
      recommendations.push(`发现 ${eslintResult.errors.length} 个ESLint错误，建议修复以提高代码质量`);
    }
    
    const typeScriptResult = analysisResults.find(r => r.type === 'typescript');
    if (typeScriptResult && typeScriptResult.errors.length > 0) {
      recommendations.push(`发现 ${typeScriptResult.errors.length} 个TypeScript错误，请修复类型问题`);
    }
    
    const securityResult = analysisResults.find(r => r.type === 'security');
    if (securityResult && securityResult.highVulnerabilities > 0) {
      recommendations.push(`发现 ${securityResult.highVulnerabilities} 个高危安全漏洞，请立即修复`);
    }
    
    const complexityResult = analysisResults.find(r => r.type === 'complexity');
    if (complexityResult && complexityResult.summary.avgComplexity > 10) {
      recommendations.push('代码复杂度较高，建议重构复杂函数');
    }
    
    return recommendations;
  }

  /**
   * 合并多个报告
   */
  async mergeReports(reportPaths) {
    const mergedReport = {
      type: 'merged',
      timestamp: new Date().toISOString(),
      reports: []
    };

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const reportPath of reportPaths) {
      try {
        const content = await fs.readFile(reportPath, 'utf-8');
        const report = JSON.parse(content);
        mergedReport.reports.push(report);

        if (report.type === 'test') {
          totalTests += report.summary.total;
          passedTests += report.summary.passed;
          failedTests += report.summary.failed;
        }
      } catch (error) {
        console.error(`Failed to read report ${reportPath}:`, error.message);
      }
    }

    mergedReport.summary = {
      totalReports: reportPaths.length,
      totalTests,
      passedTests,
      failedTests
    };

    return await this.saveReport(mergedReport, 'merged');
  }

  /**
   * 发送报告到外部系统
   */
  async sendReport(report, webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (response.ok) {
        return {
          type: 'report_sent',
          status: 'success',
          url: webhookUrl
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        type: 'report_sent',
        status: 'failure',
        error: error.message,
        url: webhookUrl
      };
    }
  }
}

// MCP服务器实现
const server = {
  name: 'report-generator',
  version: '1.0.0',
  
  tools: [
    {
      name: 'generate_test_report',
      description: '生成测试报告',
      inputSchema: {
        type: 'object',
        properties: {
          test_results: { type: 'array', description: '测试结果数组' },
          coverage: { type: 'object', description: '覆盖率数据' }
        },
        required: ['test_results']
      }
    },
    {
      name: 'generate_analysis_report',
      description: '生成代码分析报告',
      inputSchema: {
        type: 'object',
        properties: {
          analysis_results: { type: 'array', description: '分析结果数组' }
        },
        required: ['analysis_results']
      }
    },
    {
      name: 'generate_deployment_report',
      description: '生成部署报告',
      inputSchema: {
        type: 'object',
        properties: {
          deployment_results: { type: 'array', description: '部署结果数组' },
          build_info: { type: 'object', description: '构建信息' }
        },
        required: ['deployment_results']
      }
    },
    {
      name: 'generate_html_report',
      description: '生成HTML格式报告',
      inputSchema: {
        type: 'object',
        properties: {
          report_data: { type: 'object', description: '报告数据' }
        },
        required: ['report_data']
      }
    },
    {
      name: 'merge_reports',
      description: '合并多个报告',
      inputSchema: {
        type: 'object',
        properties: {
          report_paths: { type: 'array', items: { type: 'string' }, description: '报告文件路径数组' }
        },
        required: ['report_paths']
      }
    },
    {
      name: 'send_report',
      description: '发送报告到外部系统',
      inputSchema: {
        type: 'object',
        properties: {
          report: { type: 'object', description: '报告数据' },
          webhook_url: { type: 'string', description: 'Webhook URL' }
        },
        required: ['report', 'webhook_url']
      }
    }
  ],

  async callTool(name, args) {
    const generator = new ReportGeneratorMCPServer();
    
    switch (name) {
      case 'generate_test_report':
        return await generator.generateTestReport(args.test_results, args.coverage);
      
      case 'generate_analysis_report':
        return await generator.generateCodeAnalysisReport(args.analysis_results);
      
      case 'generate_deployment_report':
        return await generator.generateDeploymentReport(args.deployment_results, args.build_info);
      
      case 'generate_html_report':
        return await generator.generateHTMLReport(args.report_data);
      
      case 'merge_reports':
        return await generator.mergeReports(args.report_paths);
      
      case 'send_report':
        return await generator.sendReport(args.report, args.webhook_url);
      
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