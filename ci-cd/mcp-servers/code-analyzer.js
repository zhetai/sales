#!/usr/bin/env node

/**
 * 代码分析MCP服务器
 * 提供代码质量检查、静态分析、安全扫描功能
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const exec = promisify(require('child_process').exec);

class CodeAnalyzerMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.analysisResults = [];
  }

  /**
   * 运行ESLint检查
   */
  async runESLint(options = {}) {
    const { fix = false, format = 'json' } = options;
    
    try {
      const fixFlag = fix ? '--fix' : '';
      const command = `npx eslint src/ ${fixFlag} --format=${format}`;
      
      const { stdout, stderr } = await exec(command, {
        cwd: this.projectRoot,
        timeout: 180000
      });

      const result = {
        type: 'eslint',
        status: 'success',
        errors: format === 'json' ? JSON.parse(stdout) : [],
        warnings: [],
        duration: Date.now(),
        output: stdout
      };

      this.analysisResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'eslint',
        status: 'failure',
        error: error.message,
        errors: this.parseESLintOutput(error.stdout || ''),
        warnings: [],
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    }
  }

  /**
   * 运行TypeScript类型检查
   */
  async runTypeCheck() {
    try {
      const command = 'npx tsc --noEmit';
      const { stdout, stderr } = await exec(command, {
        cwd: this.projectRoot,
        timeout: 120000
      });

      const result = {
        type: 'typescript',
        status: 'success',
        errors: [],
        duration: Date.now(),
        output: stdout
      };

      this.analysisResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'typescript',
        status: 'failure',
        error: error.message,
        errors: this.parseTypeScriptErrors(error.stderr || ''),
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    }
  }

  /**
   * 运行安全扫描
   */
  async runSecurityScan() {
    try {
      // 使用npm audit进行基础安全扫描
      const { stdout, stderr } = await exec('npm audit --json', {
        cwd: this.projectRoot,
        timeout: 60000
      });

      const auditResult = JSON.parse(stdout);
      const vulnerabilities = auditResult.vulnerabilities || {};

      const highVulns = Object.values(vulnerabilities).filter(v => 
        v.severity === 'high' || v.severity === 'critical'
      );

      const result = {
        type: 'security',
        status: highVulns.length > 0 ? 'failure' : 'success',
        vulnerabilities: Object.keys(vulnerabilities).length,
        highVulnerabilities: highVulns.length,
        details: vulnerabilities,
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'security',
        status: 'error',
        error: error.message,
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    }
  }

  /**
   * 分析代码复杂度
   */
  async analyzeComplexity() {
    try {
      // 简单的复杂度分析：统计函数长度、文件大小等
      const srcFiles = await this.getSourceFiles();
      const complexityReport = [];

      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const stats = await fs.stat(file);
        
        const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|async\s+function/g) || [];
        const lines = content.split('\n').length;
        
        complexityReport.push({
          file: path.relative(this.projectRoot, file),
          lines,
          functions: functions.length,
          size: stats.size,
          complexity: this.calculateComplexity(content)
        });
      }

      const result = {
        type: 'complexity',
        status: 'success',
        report: complexityReport,
        summary: {
          totalFiles: srcFiles.length,
          totalLines: complexityReport.reduce((sum, r) => sum + r.lines, 0),
          totalFunctions: complexityReport.reduce((sum, r) => sum + r.functions, 0),
          avgComplexity: complexityReport.reduce((sum, r) => sum + r.complexity, 0) / complexityReport.length
        },
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'complexity',
        status: 'error',
        error: error.message,
        duration: Date.now()
      };

      this.analysisResults.push(result);
      return result;
    }
  }

  /**
   * 获取源文件列表
   */
  async getSourceFiles() {
    const { stdout } = await exec('find src -name "*.js" -o -name "*.ts" -o -name "*.astro"', {
      cwd: this.projectRoot
    });
    
    return stdout.trim().split('\n').filter(Boolean).map(file => path.join(this.projectRoot, file));
  }

  /**
   * 计算代码复杂度
   */
  calculateComplexity(content) {
    // 简化的复杂度计算
    let complexity = 1; // 基础复杂度
    
    // 增加复杂度的因素
    complexity += (content.match(/if\s*\(.*)/g) || []).length;
    complexity += (content.match(/for\s*\(.*)/g) || []).length;
    complexity += (content.match(/while\s*\(.*)/g) || []).length;
    complexity += (content.match(/catch\s*\(.*)/g) || []).length;
    complexity += (content.match(/\?\s*:/g) || []).length;
    
    return complexity;
  }

  /**
   * 解析ESLint输出
   */
  parseESLintOutput(output) {
    try {
      return JSON.parse(output);
    } catch {
      return [];
    }
  }

  /**
   * 解析TypeScript错误
   */
  parseTypeScriptErrors(output) {
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        errors.push(line.trim());
      }
    }
    
    return errors;
  }

  /**
   * 生成分析报告
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.analysisResults.length,
        passed: this.analysisResults.filter(r => r.status === 'success').length,
        failed: this.analysisResults.filter(r => r.status === 'failure').length,
        errors: this.analysisResults.filter(r => r.status === 'error').length
      },
      results: this.analysisResults
    };

    // 保存报告文件
    const reportPath = path.join(this.projectRoot, 'ci-cd', 'reports', `code-analysis-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }
}

// MCP服务器实现
const server = {
  name: 'code-analyzer',
  version: '1.0.0',
  
  tools: [
    {
      name: 'run_eslint',
      description: '运行ESLint代码质量检查',
      inputSchema: {
        type: 'object',
        properties: {
          fix: { type: 'boolean', default: false },
          format: { type: 'string', enum: ['json', 'stylish'], default: 'json' }
        }
      }
    },
    {
      name: 'run_typecheck',
      description: '运行TypeScript类型检查'
    },
    {
      name: 'run_security_scan',
      description: '运行安全漏洞扫描'
    },
    {
      name: 'analyze_complexity',
      description: '分析代码复杂度'
    },
    {
      name: 'generate_analysis_report',
      description: '生成代码分析报告'
    }
  ],

  async callTool(name, args) {
    const analyzer = new CodeAnalyzerMCPServer();
    
    switch (name) {
      case 'run_eslint':
        return await analyzer.runESLint(args);
      
      case 'run_typecheck':
        return await analyzer.runTypeCheck();
      
      case 'run_security_scan':
        return await analyzer.runSecurityScan();
      
      case 'analyze_complexity':
        return await analyzer.analyzeComplexity();
      
      case 'generate_analysis_report':
        return await analyzer.generateReport();
      
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