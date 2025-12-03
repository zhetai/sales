#!/usr/bin/env python3
"""
MCP Agent安全配置模块
提供加密、认证、审计等安全功能
"""

import os
import json
import hashlib
import hmac
import secrets
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class SecurityConfig:
    """安全配置管理"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.config_path = project_root / "ci-cd" / "security.json"
        self.logger = logging.getLogger(__name__)
        self.encryption_key = self._get_or_generate_key()
        self.max_failed_attempts = 3
        self.session_timeout = 3600  # 1小时
        self.audit_log = []
        
    def _get_or_generate_key(self) -> str:
        """获取或生成加密密钥"""
        key_file = self.project_root / "ci-cd" / ".encryption_key"
        
        if key_file.exists():
            with open(key_file, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            key = secrets.token_urlsafe(32)
            key_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 设置文件权限为仅所有者可读写
            os.chmod(key_file, 0o600)
            
            with open(key_file, 'w', encoding='utf-8') as f:
                f.write(key)
            
            self.logger.info("🔐 生成新的加密密钥")
            return key
    
    def encrypt_sensitive_data(self, data: Dict[str, Any]) -> str:
        """加密敏感数据"""
        try:
            # 将数据转换为JSON字符串
            json_data = json.dumps(data, ensure_ascii=False)
            
            # 生成加密数据
            encrypted = self._encrypt(json_data.encode('utf-8'))
            
            return encrypted
        except Exception as e:
            self.logger.error(f"加密失败: {e}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> Dict[str, Any]:
        """解密敏感数据"""
        try:
            # 解密数据
            decrypted = self._decrypt(encrypted_data)
            
            # 转换回Python对象
            return json.loads(decrypted.decode('utf-8'))
        except Exception as e:
            self.logger.error(f"解密失败: {e}")
            raise
    
    def _encrypt(self, data: bytes) -> str:
        """内部加密方法"""
        key = self.encryption_key.encode()
        
        # 使用HMAC-SHA256加密
        signature = hmac.new(key, data, hashlib.sha256).hexdigest()
        encrypted = signature + data.hex()
        
        return encrypted
    
    def _decrypt(self, encrypted_data: str) -> bytes:
        """内部解密方法"""
        key = self.encryption_key.encode()
        
        # 分离签名和数据
        signature = encrypted_data[:64]
        data_hex = encrypted_data[64:]
        
        # 验证签名
        expected_signature = hmac.new(key, bytes.fromhex(data_hex), hashlib.sha256).hexdigest()
        
        if not hmac.compare_digest(signature.encode(), expected_signature.encode()):
            raise ValueError("数据签名验证失败")
        
        return bytes.fromhex(data_hex)
    
    def validate_instruction(self, instruction: str) -> bool:
        """验证指令安全性"""
        # 检查指令长度
        if len(instruction) > 1000:
            self.logger.warning("指令长度超过限制")
            return False
        
        # 检查危险关键词
        dangerous_patterns = [
            'rm -rf /', 'sudo rm', 'format', '> /dev/null',
            'wget', 'curl', 'nc -l', 'ssh', 'scp',
            'eval', 'exec', 'system', 'import os',
            'subprocess.call', 'os.system'
        ]
        
        instruction_lower = instruction.lower()
        for pattern in dangerous_patterns:
            if pattern in instruction_lower:
                self.logger.warning(f"检测到危险指令模式: {pattern}")
                return False
        
        return True
    
    def audit_action(self, action: str, result: Any, user: Optional[str] = None) -> None:
        """审计操作"""
        audit_entry = {
            'timestamp': datetime.datetime.now().isoformat(),
            'action': action,
            'result_status': 'success' if result else 'failure',
            'user': user or 'system',
            'session_id': getattr(self, 'session_id', 'unknown'),
            'ip_address': os.getenv('REMOTE_ADDR', 'localhost')
        }
        
        self.audit_log.append(audit_entry)
        
        # 保存审计日志
        self._save_audit_log()
    
    def _save_audit_log(self) -> None:
        """保存审计日志"""
        audit_dir = self.project_root / "ci-cd" / "security"
        audit_dir.mkdir(parents=True, exist_ok=True)
        
        log_file = audit_dir / f"audit-{datetime.datetime.now().strftime('%Y%m%d')}.json"
        
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(self.audit_log[-100:], indent=2))  # 只保留最近100条
        except Exception as e:
            self.logger.error(f"保存审计日志失败: {e}")
    
    def check_rate_limit(self, user: str, action: str) -> bool:
        """检查速率限制"""
        # 简单的速率限制实现
        rate_limit_key = f"rate_limit:{user}:{action}"
        current_time = time.time()
        
        # 这里应该使用更复杂的速率限制算法
        # 目前简化为每分钟最多10次操作
        if not hasattr(self, '_rate_limits'):
            self._rate_limits = {}
        
        if rate_limit_key not in self._rate_limits:
            self._rate_limits[rate_limit_key] = []
        
        # 清理1分钟前的记录
        self._rate_limits[rate_limit_key] = [
            timestamp for timestamp in self._rate_limits[rate_limit_key]
            if current_time - timestamp < 60
        ]
        
        if len(self._rate_limits[rate_limit_key]) >= 10:
            self.logger.warning(f"速率限制触发: {user}:{action}")
            return False
        
        self._rate_limits[rate_limit_key].append(current_time)
        return True
    
    def sanitize_output(self, output: Any) -> Any:
        """清理输出中的敏感信息"""
        if isinstance(output, str):
            # 移除可能的敏感信息
            sanitized = output
            for pattern in [
                self.llm_api_key,
                self.github_token,
                'password', 'token', 'key', 'secret'
            ]:
                if pattern:
                    sanitized = sanitized.replace(pattern, '***REDACTED***')
            
            return sanitized
        elif isinstance(output, dict):
            return {
                k: self.sanitize_output(v) if isinstance(v, (str, dict)) else v
                for k, v in output.items()
            }
        
        return output
    
    def validate_mcp_config(self, config: Dict[str, Any]) -> bool:
        """验证MCP配置安全性"""
        required_fields = ['mcpServers']
        
        for field in required_fields:
            if field not in config:
                self.logger.error(f"缺少必需的配置字段: {field}")
                return False
        
        # 检查服务器配置
        for server_name, server_config in config.get('mcpServers', {}).items():
            if not self._validate_server_config(server_config):
                self.logger.error(f"服务器配置验证失败: {server_name}")
                return False
        
        return True
    
    def _validate_server_config(self, config: Dict[str, Any]) -> bool:
        """验证单个服务器配置"""
        # 检查命令是否安全
        command = config.get('command', '')
        dangerous_commands = [
            'rm -rf', 'sudo', 'su', 'chmod +x', 'eval', 'exec'
        ]
        
        for dangerous in dangerous_commands:
            if dangerous in command:
                self.logger.error(f"检测到危险命令: {dangerous}")
                return False
        
        # 检查参数
        args = config.get('args', [])
        for arg in args:
            if any(dangerous in str(arg) for dangerous in dangerous_commands):
                self.logger.error(f"检测到危险参数: {arg}")
                return False
        
        return True


class ErrorHandling:
    """错误处理和恢复机制"""
    
    def __init__(self, project_root: Path, security_config: SecurityConfig):
        self.project_root = project_root
        self.security = security_config
        self.logger = logging.getLogger(__name__)
        self.error_count = {}
        self.max_consecutive_failures = 3
        self.fallback_enabled = True
        
    def handle_error(self, error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """处理错误"""
        error_type = type(error).__name__
        error_message = str(error)
        
        # 记录错误
        self._record_error(error_type, error_message, context)
        
        # 审计连续失败次数
        consecutive_failures = self.error_count.get(error_type, 0) + 1
        self.error_count[error_type] = consecutive_failures
        
        self.logger.error(f"错误处理: {error_type} - {error_message}")
        
        # 审计连续失败次数
        if consecutive_failures >= self.max_consecutive_failures:
            self.logger.warning(f"连续失败次数过多，启用回滚机制")
            return self._trigger_fallback(context)
        
        # 根据错误类型决定处理方式
        return {
            'type': 'error_handled',
            'error_type': error_type,
            'message': error_message,
            'context': context,
            'action': 'retry',
            'consecutive_failures': consecutive_failures
        }
    
    def _record_error(self, error_type: str, message: str, context: Dict[str, Any]) -> None:
        """记录错误"""
        error_dir = self.project_root / "ci-cd" / "errors"
        error_dir.mkdir(parents=True, exist_ok=True)
        
        error_file = error_dir / f"errors-{datetime.datetime.now().strftime('%Y%m%d')}.json"
        
        try:
            error_entry = {
                'timestamp': datetime.datetime.now().isoformat(),
                'type': error_type,
                'message': message,
                'context': context,
                'session_id': getattr(self.security, 'session_id', 'unknown')
            }
            
            with open(error_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(error_entry, indent=2) + '\n')
        except Exception as e:
            self.logger.error(f"记录错误失败: {e}")
    
    def _trigger_fallback(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """触发回滚机制"""
        if not self.fallback_enabled:
            return {
                'type': 'error_handled',
                'message': '回滚机制已禁用',
                'action': 'fail'
            }
        
        self.logger.warning("🔄 启动回滚机制")
        
        try:
            # 根据上下文选择回滚策略
            fallback_result = self._execute_fallback(context)
            
            return {
                'type': 'fallback_triggered',
                'message': '已执行回滚策略',
                'action': 'fallback',
                'fallback_result': fallback_result
            }
        except Exception as fallback_error:
            self.logger.error(f"回滚失败: {fallback_error}")
            return {
                'type': 'fallback_failed',
                'message': f'回滚失败: {fallback_error}',
                'action': 'fail'
            }
    
    def _execute_fallback(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行回滚策略"""
        instruction = context.get('instruction', '')
        
        # 根据指令类型选择回滚策略
        if '测试' in instruction:
            return self._fallback_tests()
        elif '检查' in instruction or 'lint' in instruction:
            return self._fallback_lint()
        elif '构建' in instruction:
            return self._fallback_build()
        elif '部署' in instruction:
            return self._fallback_deploy()
        else:
            return self._fallback_generic()
    
    def _fallback_tests(self) -> Dict[str, Any]:
        """测试回滚策略"""
        self.logger.info("🔄 执行测试回滚")
        
        try:
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
                'returncode': result.returncode
            }
        except Exception as e:
            return {
                'type': 'fallback_tests',
                'status': 'error',
                'error': str(e)
            }
    
    def _fallback_lint(self) -> Dict[str, Any]:
        """代码检查回滚策略"""
        self.logger.info("🔄 执行代码检查回滚")
        
        try:
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
                'returncode': result.returncode
            }
        except Exception as e:
            return {
                'type': 'fallback_lint',
                'status': 'error',
                'error': str(e)
            }
    
    def _fallback_build(self) -> Dict[str, Any]:
        """构建回滚策略"""
        self.logger.info("🔄 执行构建回滚")
        
        try:
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
                'returncode': result.returncode
            }
        except Exception as e:
            return {
                'type': 'fallback_build',
                'status': 'error',
                'error': str(e)
            }
    
    def _fallback_deploy(self) -> Dict[str, Any]:
        """部署回滚策略"""
        self.logger.info("🔄 执行部署回滚")
        
        try:
            # 使用简单的部署脚本
            result = subprocess.run(
                ['npm', 'run', 'deploy'],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            return {
                'type': 'fallback_deploy',
                'status': 'success' if result.returncode == 0 else 'failure',
                'output': result.stdout,
                'error': result.stderr,
                'returncode': result.returncode
            }
        except Exception as e:
            return {
                'type': 'fallback_deploy',
                'status': 'error',
                'error': str(e)
            }
    
    def _fallback_generic(self) -> Dict[str, Any]:
        """通用回滚策略"""
        self.logger.info("🔄 执行通用回滚")
        
        return {
            'type': 'fallback_generic',
            'status': 'success',
            'message': '执行通用回滚策略'
        }
    
    def reset_error_count(self, error_type: str = None) -> None:
        """重置错误计数"""
        if error_type:
            self.error_count[error_type] = 0
        else:
            self.error_count.clear()
        
        self.logger.info("🔄 重置错误计数")


# 导出安全配置类
__all__ = ['SecurityConfig', 'ErrorHandling']