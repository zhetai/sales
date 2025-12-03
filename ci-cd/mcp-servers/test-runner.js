#!/usr/bin/env node

/**
 * 测试执行MCP服务器
 * 提供单元测试、集成测试执行功能
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const exec = promisify(require('child_process').exec);

class TestRunnerMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = [];
  }

  /**
   * 运行单元测试
   */
  async runUnitTests(options = {}) {
    const { coverage = true, watch = false } = options;
    
    try {
      const command = coverage 
        ? 'npm run test:run -- --coverage'
        : 'npm run test:run';
      
      const { stdout, stderr } = await exec(command, {
        cwd: this.projectRoot,
        timeout: 300000
      });

      const result = {
        type: 'unit-tests',
        status: 'success',
        coverage: this.parseCoverageOutput(stdout),
        testResults: this.parseTestOutput(stdout),
        duration: Date.now(),
        output: stdout
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'unit-tests',
        status: 'failure',
        error: error.message,
        testResults: this.parseTestOutput(error.stdout || ''),
        duration: Date.now(),
        output: error.stdout || ''
      };

      this.testResults.push(result);
      throw new Error(`单元测试失败: ${error.message}`);
    }
  }

  /**
   * 运行特定测试文件
   */
  async runSpecificTest(testPattern, options = {}) {
    try {
      const command = `npm run test:run -- ${testPattern}`;
      const { stdout, stderr } = await exec(command, {
        cwd: this.projectRoot,
        timeout: 180000
      });

      return {
        type: 'specific-tests',
        pattern: testPattern,
        status: 'success',
        testResults: this.parseTestOutput(stdout),
        duration: Date.now(),
        output: stdout
      };
    } catch (error) {
      return {
        type: 'specific-tests',
        pattern: testPattern,
        status: 'failure',
        error: error.message,
        testResults: this.parseTestOutput(error.stdout || ''),
        duration: Date.now()
      };
    }
  }

  /**
   * 解析测试输出
   */
  parseTestOutput(output) {
    const lines = output.split('\n');
    const testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: []
    };

    for (const line of lines) {
      if (line.includes('Test Files')) {
        const match = line.match(/(\d+)\s+passed\s*\((\d+)\)/);
        if (match) {
          testResults.passed = parseInt(match[1]);
          testResults.total = parseInt(match[1]) + parseInt(match[2] || 0);
        }
      }
      
      if (line.includes('✓') || line.includes('✗')) {
        const isFailed = line.includes('✗');
        if (isFailed) {
          testResults.failed++;
          testResults.failures.push(line.trim());
        }
      }
    }

    return testResults;
  }

  /**
   * 解析覆盖率输出
   */
  parseCoverageOutput(output) {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      return {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3])
      };
    }
    return null;
  }

  /**
   * 生成测试报告
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'success').length,
        failed: this.testResults.filter(r => r.status === 'failure').length
      },
      results: this.testResults
    };

    // 保存报告文件
    const reportPath = path.join(this.projectRoot, 'ci-cd', 'reports', `test-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }
}

// MCP服务器实现
const server = {
  name: 'test-runner',
  version: '1.0.0',
  
  tools: [
    {
      name: 'run_unit_tests',
      description: '运行所有单元测试',
      inputSchema: {
        type: 'object',
        properties: {
          coverage: { type: 'boolean', default: true },
          watch: { type: 'boolean', default: false }
        }
      }
    },
    {
      name: 'run_specific_test',
      description: '运行特定的测试文件或模式',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: '测试文件模式，如 "auth.test.js"' }
        },
        required: ['pattern']
      }
    },
    {
      name: 'generate_test_report',
      description: '生成测试报告'
    }
  ],

  async callTool(name, args) {
    const runner = new TestRunnerMCPServer();
    
    switch (name) {
      case 'run_unit_tests':
        return await runner.runUnitTests(args);
      
      case 'run_specific_test':
        return await runner.runSpecificTest(args.pattern, args);
      
      case 'generate_test_report':
        return await runner.generateReport();
      
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
