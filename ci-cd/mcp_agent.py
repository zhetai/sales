#!/usr/bin/env python3
"""
MCP-use CI/CD代理脚本
基于mcp-use框架的AI驱动CI/CD自动化代理
"""

import os
import sys
import json
import subprocess
import asyncio
import logging
import uuid
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# 导入安全配置
from security import SecurityConfig, ErrorHandling
from rollback import RollbackManager, RollbackStrategySelector, RollbackStrategy

# 导入mcp-use相关模块
try:
    from mcp_use import MCPClient, Tool
except ImportError:
    print("❌ 请安装mcp-use框架: pip install mcp-use")
    sys.exit(1)


class MCPAgent:
    """MCP-use驱动的CI/CD代理"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.config_path = self.project_root / "ci-cd" / "mcp-config.json"
        self.llm_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.github_token = os.getenv("GITHUB_PAT")
        self.max_retries = 3
        self.timeout = 300  # 5分钟
        self.session_id = str(uuid.uuid4())
        self.conversation_history = []
        self.mcp_clients = {}
        self.logger = self._setup_logging()
        
        # 初始化安全和错误处理
        self.security = SecurityConfig(self.project_root)
        self.error_handling = ErrorHandling(self.project_root, self.security)
        self.rollback_manager = RollbackManager(self.project_root, self.logger)
        
        # 设置session_id到安全配置
        self.security.session_id = self.session_id
        
    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        log_dir = self.project_root / "ci-cd" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / f"mcp-agent-{datetime.datetime.now().strftime('%Y%m%d')}.log"),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    async def initialize(self):
        """初始化代理"""
        self.logger.info(f"🤖 MCP Agent 初始化中... (Session: {self.session_id})")
        
        # 验证环境变量
        if not self.llm_api_key:
            raise ValueError("缺少 ANTHROPIC_API_KEY 环境变量")
        
        if not self.github_token:
            self.logger.warning("⚠️  缺少 GITHUB_PAT 环境变量，GitHub集成功能将不可用")
        
        # 加载MCP配置
        await self._load_mcp_config()
        
        # 启动MCP客户端
        await self._start_mcp_clients()
        
        self.logger.info("✅ MCP Agent 初始化完成")
    
    async def _load_mcp_config(self):
        """加载MCP配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.mcp_config = json.load(f)
            
            self.logger.info(f"📋 已加载MCP配置: {len(self.mcp_config['mcpServers'])} 个服务器")
        except Exception as e:
            raise ValueError(f"加载MCP配置失败: {e}")
    
    async def _start_mcp_clients(self):
        """启动MCP客户端"""
        self.mcp_clients = {}
        
        for name, config in self.mcp_config['mcpServers'].items():
            try:
                self.logger.info(f"🚀 启动MCP客户端: {name}")
                
                # 创建MCP客户端
                client = MCPClient(
                    command=config['command'],
                    args=config.get('args', []),
                    cwd=self.project_root
                )
                
                # 启动客户端
                await client.start()
                await self._wait_for_client_ready(client)
                
                self.mcp_clients[name] = client
                self.logger.info(f"✅ MCP客户端 {name} 启动成功")
                
            except Exception as e:
                self.logger.error(f"❌ MCP客户端 {name} 启动失败: {e}")
                raise
    
    async def _wait_for_client_ready(self, client, timeout=10):
        """等待客户端准备就绪"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                # 尝试获取客户端信息
                info = await client.get_info()
                if info:
                    return
            except:
                pass
            
            await asyncio.sleep(0.5)
        
        raise TimeoutError("客户端启动超时")
    
    async def execute_instruction(self, instruction: str) -> Dict[str, Any]:
        """执行自然语言指令"""
        self.logger.info(f"📝 执行指令: {instruction}")
        
        # 安全验证指令
        if not self.security.validate_instruction(instruction):
            raise ValueError("指令包含不安全内容")
        
        # 检查速率限制
        if not self.security.check_rate_limit(instruction):
            raise ValueError("请求频率过高，请稍后重试")
        
        # 记录审计日志
        self.security.log_audit_event("instruction_received", {
            "instruction": instruction,
            "session_id": self.session_id
        })
        
        try:
            # 解析指令
            parsed_instruction = await self._parse_instruction(instruction)
            self.logger.info(f"🔍 指令解析结果: {parsed_instruction}")
            
            # 创建回滚检查点
            checkpoint = self.rollback_manager.create_checkpoint(
                f"before_{parsed_instruction.get('type', 'instruction')}",
                RollbackStrategy.GRACEFUL
            )
            
            self.security.log_audit_event("checkpoint_created", {
                "checkpoint_id": checkpoint["id"],
                "checkpoint_name": checkpoint["name"],
                "session_id": self.session_id
            })
            self.logger.info(f"🔍 指令解析结果: {parsed_instruction}")
            
            # 执行任务序列
            results = await self._execute_task_sequence(parsed_instruction)
            
            # 生成报告
            report = await self._generate_report(instruction, results)
            
            # 加密敏感数据
            encrypted_report = self.security.encrypt_sensitive_data(report)
            
            self.logger.info("📊 任务执行完成")
            
            # 记录成功审计日志
            self.security.log_audit_event("instruction_completed", {
                "instruction": instruction,
                "session_id": self.session_id,
                "success": True
            })
            
            return report
            
        except Exception as e:
            self.logger.error(f"❌ 指令执行失败: {e}")
            
            # 错误处理和回滚
            handled_result = await self.error_handling.handle_error(
                error=e,
                context={"instruction": instruction, "session_id": self.session_id}
            )
            
            # 如果错误严重，执行自动回滚
            if self._should_auto_rollback(e):
                self.logger.warning(f"🚨 检测到严重错误，执行自动回滚: {e}")
                
                try:
                    rollback_result = await self.rollback_manager.execute_rollback(
                        checkpoint["id"],
                        reason=f"自动回滚: {str(e)}"
                    )
                    
                    handled_result["auto_rollback"] = {
                        "executed": True,
                        "checkpoint_id": checkpoint["id"],
                        "rollback_result": rollback_result
                    }
                    
                    self.security.log_audit_event("auto_rollback_executed", {
                        "checkpoint_id": checkpoint["id"],
                        "reason": str(e),
                        "session_id": self.session_id,
                        "success": rollback_result["success"]
                    })
                    
                except Exception as rollback_error:
                    self.logger.error(f"❌ 自动回滚失败: {rollback_error}")
                    
                    handled_result["auto_rollback"] = {
                        "executed": True,
                        "success": False,
                        "error": str(rollback_error)
                    }
            
            return handled_result
    
    async def _parse_instruction(self, instruction: str) -> Dict[str, Any]:
        """解析自然语言指令"""
        # 简单的规则匹配（实际应该使用LLM）
        task_patterns = {
            'test': {
                'keywords': ['测试', 'test', '单元测试', 'unit test'],
                'actions': ['run_unit_tests', 'generate_test_report']
            },
            'lint': {
                'keywords': ['检查', '代码质量', 'lint', 'eslint'],
                'actions': ['run_eslint', 'run_typecheck', 'generate_analysis_report']
            },
            'security': {
                'keywords': ['安全', '漏洞', 'security', 'scan'],
                'actions': ['run_security_scan', 'generate_analysis_report']
            },
            'coverage': {
                'keywords': ['覆盖率', 'coverage', '测试覆盖'],
                'actions': ['run_unit_tests', 'generate_test_report']
            },
            'build': {
                'keywords': ['构建', 'build', '编译'],
                'actions': ['run_build', 'generate_deployment_report']
            }
        }
        
        instruction_lower = instruction.lower()
        detected_type = None
        confidence = 0
        
        for task_type, pattern in task_patterns.items():
            match_count = sum(1 for keyword in pattern['keywords'] 
                            if keyword in instruction_lower)
            
            if match_count > confidence:
                detected_type = task_type
                confidence = match_count
        
        if not detected_type:
            raise ValueError(f"无法识别指令类型: {instruction}")
        
        return {
            'type': detected_type,
            'confidence': confidence,
            'instruction': instruction,
            'actions': task_patterns[detected_type]['actions'],
            'parsed_at': datetime.datetime.now().isoformat()
        }
    
    async def _execute_task_sequence(self, parsed_instruction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """执行任务序列"""
        results = []
        
        for action in parsed_instruction['actions']:
            self.logger.info(f"⚡ 执行任务: {action}")
            
            # 记录任务开始审计日志
            self.security.log_audit_event("task_started", {
                "action": action,
                "session_id": self.session_id
            })
            
            try:
                result = await self._execute_action(action)
                results.append({
                    'action': action,
                    'status': 'success',
                    'result': result,
                    'timestamp': datetime.datetime.now().isoformat()
                })
                
                # 记录任务成功审计日志
                self.security.log_audit_event("task_completed", {
                    "action": action,
                    "session_id": self.session_id,
                    "success": True
                })
                
            except Exception as e:
                # 使用错误处理模块
                error_context = {
                    "action": action,
                    "session_id": self.session_id,
                    "instruction_type": parsed_instruction['type']
                }
                
                handled_result = await self.error_handling.handle_error(e, error_context)
                
                results.append({
                    'action': action,
                    'status': 'failure',
                    'error': str(e),
                    'handled': handled_result.get('handled', False),
                    'fallback_used': handled_result.get('fallback_used', False),
                    'timestamp': datetime.datetime.now().isoformat()
                })
                
                # 记录任务失败审计日志
                self.security.log_audit_event("task_failed", {
                    "action": action,
                    "session_id": self.session_id,
                    "error": str(e),
                    "fallback_used": handled_result.get('fallback_used', False)
                })
                
                # 根据任务类型决定是否继续
                if self._should_stop_on_error(parsed_instruction['type'], action):
                    raise RuntimeError(f"任务 {action} 失败，停止执行")
        
        return results
    
    async def _execute_action(self, action: str) -> Any:
        """执行单个动作"""
        action_map = {
            'run_unit_tests': lambda: self._call_mcp_tool('test-runner', 'run_unit_tests', {'coverage': True}),
            'run_eslint': lambda: self._call_mcp_tool('code-analyzer', 'run_eslint', {'format': 'json'}),
            'run_typecheck': lambda: self._call_mcp_tool('code-analyzer', 'run_typecheck'),
            'run_security_scan': lambda: self._call_mcp_tool('code-analyzer', 'run_security_scan'),
            'generate_test_report': lambda: self._call_mcp_tool('report-generator', 'generate_test_report', {
                'test_results': self._get_test_results()
            }),
            'generate_analysis_report': lambda: self._call_mcp_tool('report-generator', 'generate_analysis_report', {
                'analysis_results': self._get_analysis_results()
            }),
            'run_build': self._run_build_command,
            'create_github_issue': lambda title, body: self._call_mcp_tool('github-integration', 'create_issue', {'title': title, 'body': body}),
            'create_pr_comment': lambda pr_number, body: self._call_mcp_tool('github-integration', 'create_pr_comment', {
                'pr_number': pr_number, 'body': body
            })
        }
        
        action_func = action_map.get(action)
        if not action_func:
            raise ValueError(f"未知动作: {action}")
        
        return await action_func()
    
    async def _call_mcp_tool(self, server_name: str, tool_name: str, args: Dict[str, Any] = None) -> Any:
        """调用MCP工具"""
        client = self.mcp_clients.get(server_name)
        if not client:
            raise ValueError(f"MCP客户端 {server_name} 未启动")
        
        # 验证工具调用参数
        if not self.security.validate_tool_call(tool_name, args or {}):
            raise ValueError(f"工具调用参数不安全: {tool_name}")
        
        # 记录工具调用审计日志
        self.security.log_audit_event("tool_call", {
            "server": server_name,
            "tool": tool_name,
            "args": self.security.sanitize_log_data(args or {}),
            "session_id": self.session_id
        })
        
        # 重试机制
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                result = await client.call_tool(tool_name, args or {})
                
                # 记录工具调用成功审计日志
                self.security.log_audit_event("tool_call_success", {
                    "server": server_name,
                    "tool": tool_name,
                    "attempt": attempt + 1,
                    "session_id": self.session_id
                })
                
                return result
                
            except Exception as e:
                last_exception = e
                self.logger.warning(f"⚠️  MCP工具调用失败 (尝试 {attempt + 1}/{self.max_retries}): {e}")
                
                if attempt < self.max_retries - 1:
                    # 等待后重试
                    await asyncio.sleep(2 ** attempt)  # 指数退避
                else:
                    # 记录工具调用失败审计日志
                    self.security.log_audit_event("tool_call_failed", {
                        "server": server_name,
                        "tool": tool_name,
                        "attempts": self.max_retries,
                        "error": str(e),
                        "session_id": self.session_id
                    })
        
        raise RuntimeError(f"MCP工具调用失败 {server_name}.{tool_name} (已重试{self.max_retries}次): {last_exception}")
    
    async def _run_build_command(self) -> Dict[str, Any]:
        """运行构建命令"""
        try:
            result = subprocess.run(
                ['npm', 'run', 'build'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            return {
                'type': 'build',
                'status': 'success' if result.returncode == 0 else 'failure',
                'output': result.stdout,
                'error': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'type': 'build',
                'status': 'timeout',
                'error': '构建超时'
            }
        except Exception as e:
            return {
                'type': 'build',
                'status': 'error',
                'error': str(e)
            }
    
    def _get_test_results(self) -> List[Dict[str, Any]]:
        """获取测试结果（模拟）"""
        # 这里应该从实际的测试结果中获取
        return [{
            'type': 'unit-tests',
            'status': 'success',
            'test_results': {'total': 10, 'passed': 9, 'failed': 1, 'skipped': 0}
        }]
    
    def _get_analysis_results(self) -> List[Dict[str, Any]]:
        """获取分析结果（模拟）"""
        # 这里应该从实际的分析结果中获取
        return [{
            'type': 'eslint',
            'status': 'success',
            'errors': []
        }]
    
    def _should_stop_on_error(self, task_type: str, action: str) -> bool:
        """判断是否在错误时停止"""
        # 测试失败时停止，代码分析警告继续
        return task_type == 'test' and 'unit_tests' in action
    
    def _should_auto_rollback(self, error: Exception) -> bool:
        """判断是否应该自动回滚"""
        error_str = str(error).lower()
        
        # 严重错误模式
        critical_error_patterns = [
            "build failed",
            "dependency conflict",
            "permission denied",
            "file not found",
            "import error",
            "module not found",
            "syntax error",
            "type error",
            "network timeout",
            "connection refused"
        ]
        
        # 检查是否包含严重错误模式
        return any(pattern in error_str for pattern in critical_error_patterns)
    
    async def _generate_report(self, instruction: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成报告"""
        # 创建基础报告
        report = {
            'session_id': self.session_id,
            'instruction': instruction,
            'timestamp': datetime.datetime.now().isoformat(),
            'summary': {
                'total': len(results),
                'success': len([r for r in results if r['status'] == 'success']),
                'failure': len([r for r in results if r['status'] == 'failure']),
                'fallback_used': len([r for r in results if r.get('fallback_used', False)])
            },
            'results': results,
            'recommendations': self._generate_recommendations(results),
            'security_info': {
                'rate_limit_remaining': self.security.get_rate_limit_remaining(),
                'audit_log_entries': len(self.security.get_audit_log()),
                'session_secure': True
            }
        }
        
        # 记录报告生成审计日志
        self.security.log_audit_event("report_generated", {
            "session_id": self.session_id,
            "total_tasks": report['summary']['total'],
            "success_tasks": report['summary']['success'],
            "failure_tasks": report['summary']['failure']
        })
        
        # 保存报告（加密敏感数据）
        report_dir = self.project_root / "ci-cd" / "reports"
        report_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存原始报告
        report_path = report_dir / f"agent-report-{int(time.time())}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 保存加密报告
        encrypted_report_path = report_dir / f"agent-report-{int(time.time())}.encrypted"
        encrypted_data = self.security.encrypt_sensitive_data(report)
        with open(encrypted_report_path, 'w', encoding='utf-8') as f:
            f.write(encrypted_data)
        
        # 发送到GitHub（如果有token且存在失败）
        if self.github_token and any(r['status'] == 'failure' for r in results):
            await self._notify_github(report)
        
        return report
    
    def _generate_recommendations(self, results: List[Dict[str, Any]]) -> List[str]:
        """生成建议"""
        recommendations = []
        
        failures = [r for r in results if r['status'] == 'failure']
        if failures:
            recommendations.append('存在失败的任务，请检查并修复相关问题')
        
        test_failure = next((r for r in results if r['action'] == 'run_unit_tests' and r['status'] == 'failure'), None)
        if test_failure:
            recommendations.append('测试失败，建议检查测试用例和代码逻辑')
        
        return recommendations
    
    async def _notify_github(self, report: Dict[str, Any]):
        """通知GitHub"""
        try:
            title = f"CI/CD代理执行报告 - {'失败' if report['summary']['failure'] > 0 else '成功'}"
            body = self._format_github_report(report)
            
            # 这里应该调用GitHub集成MCP服务器
            self.logger.info(f"📤 发送GitHub通知: {title}")
        except Exception as e:
            self.logger.error(f"GitHub通知失败: {e}")
    
    def _format_github_report(self, report: Dict[str, Any]) -> str:
        """格式化GitHub报告"""
        markdown = f"""## CI/CD代理执行报告

**会话ID**: {report['session_id']}
**指令**: {report['instruction']}
**时间**: {report['timestamp']}

### 执行摘要

- 总任务数: {report['summary']['total']}
- 成功: {report['summary']['success']}
- 失败: {report['summary']['failure']}

"""
        
        if report['recommendations']:
            markdown += "### 建议\n\n"
            for rec in report['recommendations']:
                markdown += f"- {rec}\n"
            markdown += "\n"
        
        markdown += "### 详细结果\n\n"
        for result in report['results']:
            markdown += f"#### {result['action']}\n"
            markdown += f"- 状态: {result['status']}\n"
            if result.get('error'):
                markdown += f"- 错误: {result['error']}\n"
            markdown += "\n"
        
        return markdown
    
    async def _handle_error(self, instruction: str, error: Exception) -> Dict[str, Any]:
        """错误处理"""
        self.logger.error(f"🚨 处理错误: {error}")
        
        # 记录错误
        error_report = {
            'session_id': self.session_id,
            'instruction': instruction,
            'error': str(error),
            'timestamp': datetime.datetime.now().isoformat(),
            'stack': traceback.format_exc()
        }
        
        error_dir = self.project_root / "ci-cd" / "reports"
        error_dir.mkdir(parents=True, exist_ok=True)
        
        error_path = error_dir / f"error-{int(time.time())}.json"
        with open(error_path, 'w', encoding='utf-8') as f:
            json.dump(error_report, f, indent=2, ensure_ascii=False)
        
        # 尝试回滚到传统脚本
        return await self._fallback_to_traditional_script(instruction)
    
    async def _fallback_to_traditional_script(self, instruction: str) -> Dict[str, Any]:
        """回滚到传统脚本"""
        self.logger.info("🔄 回滚到传统CI/CD脚本")
        
        try:
            # 根据指令类型执行对应的传统脚本
            if '测试' in instruction:
                return await self._run_traditional_tests()
            elif '检查' in instruction or 'lint' in instruction:
                return await self._run_traditional_lint()
            elif '构建' in instruction:
                return await self._run_traditional_build()
            else:
                raise ValueError(f"无法回滚: 未找到对应的传统脚本")
        except Exception as fallback_error:
            raise RuntimeError(f"回滚也失败了: {fallback_error}")
    
    async def _run_traditional_tests(self) -> Dict[str, Any]:
        """运行传统测试"""
        result = subprocess.run(
            ['npm', 'run', 'test:run'],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        return {
            'type': 'fallback_tests',
            'status': 'success' if result.returncode == 0 else 'failure',
            'output': result.stdout,
            'error': result.stderr,
            'returncode': result.returncode,
            'fallback': True
        }
    
    async def _run_traditional_lint(self) -> Dict[str, Any]:
        """运行传统代码检查"""
        result = subprocess.run(
            ['npm', 'run', 'lint'],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            timeout=180
        )
        
        return {
            'type': 'fallback_lint',
            'status': 'success' if result.returncode == 0 else 'failure',
            'output': result.stdout,
            'error': result.stderr,
            'returncode': result.returncode,
            'fallback': True
        }
    
    async def _run_traditional_build(self) -> Dict[str, Any]:
        """运行传统构建"""
        result = subprocess.run(
            ['npm', 'run', 'build'],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        return {
            'type': 'fallback_build',
            'status': 'success' if result.returncode == 0 else 'failure',
            'output': result.stdout,
            'error': result.stderr,
            'returncode': result.returncode,
            'fallback': True
        }
    
    async def cleanup(self):
        """清理资源"""
        self.logger.info("🧹 清理资源...")
        
        # 记录清理开始审计日志
        self.security.log_audit_event("cleanup_started", {
            "session_id": self.session_id
        })
        
        try:
            # 停止所有MCP客户端
            for name, client in self.mcp_clients.items():
                self.logger.info(f"🛑 停止MCP客户端: {name}")
                try:
                    await client.stop()
                except Exception as e:
                    self.logger.error(f"停止客户端 {name} 失败: {e}")
            
            # 安全清理敏感数据
            self.security.cleanup_sensitive_data()
            
            # 清理旧的回滚检查点
            self.rollback_manager.cleanup_old_checkpoints(keep_count=5)
            
            # 保存最终审计日志
            final_audit_log = self.security.get_audit_log()
            audit_log_path = self.project_root / "ci-cd" / "logs" / f"audit-{self.session_id}.json"
            with open(audit_log_path, 'w', encoding='utf-8') as f:
                json.dump(final_audit_log, f, indent=2, ensure_ascii=False)
            
            # 记录清理完成审计日志
            self.security.log_audit_event("cleanup_completed", {
                "session_id": self.session_id,
                "total_audit_entries": len(final_audit_log)
            })
            
            self.logger.info("✅ 资源清理完成")
            
        except Exception as e:
            self.logger.error(f"❌ 资源清理失败: {e}")
            
            # 记录清理失败审计日志
            self.security.log_audit_event("cleanup_failed", {
                "session_id": self.session_id,
                "error": str(e)
            })
            raise


async def main():
    """主函数"""
    agent = MCPAgent()
    
    try:
        await agent.initialize()
        
        # 获取指令参数
        instruction = None
        for i, arg in enumerate(sys.argv):
            if arg.startswith('--instruction='):
                instruction = arg.split('=', 1)[1]
                break
        
        if not instruction:
            print("❌ 请提供指令，格式: --instruction=\"你的指令\"")
            sys.exit(1)
        
        # 执行指令
        report = await agent.execute_instruction(instruction)
        
        print("\n📋 执行报告:")
        print(json.dumps(report, indent=2, ensure_ascii=False))
        
        sys.exit(1 if report['summary']['failure'] > 0 else 0)
        
    except Exception as e:
        print(f"💥 代理执行失败: {e}")
        sys.exit(1)
    finally:
        await agent.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
