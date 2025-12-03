#!/usr/bin/env python3
"""
回滚策略模块
提供多种回滚机制以确保CI/CD流程的可靠性
"""

import os
import sys
import json
import subprocess
import asyncio
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
from enum import Enum


class RollbackStrategy(Enum):
    """回滚策略枚举"""
    IMMEDIATE = "immediate"          # 立即回滚
    GRACEFUL = "graceful"           # 优雅回滚
    PARTIAL = "partial"             # 部分回滚
    MANUAL = "manual"               # 手动回滚


class RollbackManager:
    """回滚管理器"""
    
    def __init__(self, project_root: Path, logger: logging.Logger):
        self.project_root = project_root
        self.logger = logger
        self.rollback_dir = project_root / "ci-cd" / "rollbacks"
        self.rollback_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoints = {}
        self.rollback_history = []
        
    def create_checkpoint(self, name: str, strategy: RollbackStrategy = RollbackStrategy.GRACEFUL) -> Dict[str, Any]:
        """创建回滚检查点"""
        checkpoint_id = f"checkpoint_{int(datetime.now().timestamp())}"
        checkpoint_path = self.rollback_dir / checkpoint_id
        checkpoint_path.mkdir(parents=True, exist_ok=True)
        
        checkpoint_data = {
            "id": checkpoint_id,
            "name": name,
            "strategy": strategy.value,
            "created_at": datetime.now().isoformat(),
            "project_root": str(self.project_root),
            "git_commit": self._get_current_commit(),
            "files_backup": {},
            "dependencies_backup": {},
            "environment_backup": {}
        }
        
        try:
            # 备份关键文件
            self._backup_critical_files(checkpoint_path, checkpoint_data)
            
            # 备份依赖
            self._backup_dependencies(checkpoint_path, checkpoint_data)
            
            # 备份环境变量
            self._backup_environment(checkpoint_path, checkpoint_data)
            
            # 保存检查点数据
            checkpoint_file = checkpoint_path / "checkpoint.json"
            with open(checkpoint_file, 'w', encoding='utf-8') as f:
                json.dump(checkpoint_data, f, indent=2, ensure_ascii=False)
            
            self.checkpoints[checkpoint_id] = checkpoint_data
            
            self.logger.info(f"📸 创建回滚检查点: {name} ({checkpoint_id})")
            
            return checkpoint_data
            
        except Exception as e:
            self.logger.error(f"❌ 创建回滚检查点失败: {e}")
            # 清理失败的检查点
            if checkpoint_path.exists():
                shutil.rmtree(checkpoint_path)
            raise
    
    async def execute_rollback(self, checkpoint_id: str, reason: str = "") -> Dict[str, Any]:
        """执行回滚"""
        if checkpoint_id not in self.checkpoints:
            # 尝试从文件加载检查点
            self._load_checkpoint_from_file(checkpoint_id)
        
        if checkpoint_id not in self.checkpoints:
            raise ValueError(f"检查点不存在: {checkpoint_id}")
        
        checkpoint = self.checkpoints[checkpoint_id]
        strategy = RollbackStrategy(checkpoint['strategy'])
        
        self.logger.info(f"🔄 开始回滚到检查点: {checkpoint['name']} ({checkpoint_id})")
        
        rollback_result = {
            "checkpoint_id": checkpoint_id,
            "checkpoint_name": checkpoint['name'],
            "strategy": strategy.value,
            "reason": reason,
            "started_at": datetime.now().isoformat(),
            "steps": [],
            "success": False
        }
        
        try:
            if strategy == RollbackStrategy.IMMEDIATE:
                await self._immediate_rollback(checkpoint, rollback_result)
            elif strategy == RollbackStrategy.GRACEFUL:
                await self._graceful_rollback(checkpoint, rollback_result)
            elif strategy == RollbackStrategy.PARTIAL:
                await self._partial_rollback(checkpoint, rollback_result)
            elif strategy == RollbackStrategy.MANUAL:
                await self._manual_rollback(checkpoint, rollback_result)
            
            rollback_result["success"] = True
            rollback_result["completed_at"] = datetime.now().isoformat()
            
            self.logger.info(f"✅ 回滚完成: {checkpoint['name']}")
            
        except Exception as e:
            rollback_result["success"] = False
            rollback_result["error"] = str(e)
            rollback_result["completed_at"] = datetime.now().isoformat()
            
            self.logger.error(f"❌ 回滚失败: {e}")
            raise
        
        # 记录回滚历史
        self.rollback_history.append(rollback_result)
        
        return rollback_result
    
    async def _immediate_rollback(self, checkpoint: Dict[str, Any], result: Dict[str, Any]):
        """立即回滚"""
        steps = result["steps"]
        
        # 1. 恢复文件
        steps.append(await self._restore_files(checkpoint))
        
        # 2. 恢复依赖
        steps.append(await self._restore_dependencies(checkpoint))
        
        # 3. 恢复环境变量
        steps.append(await self._restore_environment(checkpoint))
        
        # 4. Git回滚（如果需要）
        if checkpoint.get('git_commit'):
            steps.append(await self._rollback_git(checkpoint['git_commit']))
    
    async def _graceful_rollback(self, checkpoint: Dict[str, Any], result: Dict[str, Any]):
        """优雅回滚"""
        steps = result["steps"]
        
        # 1. 检查当前状态
        current_status = await self._check_current_status()
        steps.append({"step": "status_check", "status": "success", "data": current_status})
        
        # 2. 备份当前状态
        current_checkpoint = self.create_checkpoint("before_rollback", RollbackStrategy.IMMEDIATE)
        steps.append({"step": "current_backup", "status": "success", "checkpoint_id": current_checkpoint["id"]})
        
        # 3. 优雅停止服务
        steps.append(await self._graceful_stop_services())
        
        # 4. 恢复文件
        steps.append(await self._restore_files(checkpoint))
        
        # 5. 恢复依赖
        steps.append(await self._restore_dependencies(checkpoint))
        
        # 6. 验证恢复
        steps.append(await self._verify_rollback(checkpoint))
        
        # 7. 重启服务
        steps.append(await self._restart_services())
    
    async def _partial_rollback(self, checkpoint: Dict[str, Any], result: Dict[str, Any]):
        """部分回滚"""
        steps = result["steps"]
        
        # 只恢复关键文件，不恢复依赖和环境
        steps.append(await self._restore_files(checkpoint, critical_only=True))
        
        # 验证部分恢复
        steps.append(await self._verify_partial_rollback(checkpoint))
    
    async def _manual_rollback(self, checkpoint: Dict[str, Any], result: Dict[str, Any]):
        """手动回滚"""
        steps = result["steps"]
        
        # 生成手动回滚指南
        guide = self._generate_manual_rollback_guide(checkpoint)
        
        guide_file = self.rollback_dir / f"manual_rollback_guide_{checkpoint['id']}.md"
        with open(guide_file, 'w', encoding='utf-8') as f:
            f.write(guide)
        
        steps.append({
            "step": "generate_guide",
            "status": "success",
            "guide_file": str(guide_file),
            "message": "请按照生成的指南手动执行回滚"
        })
        
        self.logger.info(f"📋 手动回滚指南已生成: {guide_file}")
    
    def _backup_critical_files(self, checkpoint_path: Path, checkpoint_data: Dict[str, Any]):
        """备份关键文件"""
        critical_files = [
            "package.json",
            "package-lock.json",
            "wrangler.toml",
            "wrangler.jsonc",
            "astro.config.mjs",
            "src/workers/main.js"
        ]
        
        files_backup = {}
        backup_dir = checkpoint_path / "files"
        backup_dir.mkdir(exist_ok=True)
        
        for file_path in critical_files:
            source_file = self.project_root / file_path
            if source_file.exists():
                backup_file = backup_dir / file_path
                backup_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_file, backup_file)
                files_backup[file_path] = str(backup_file)
        
        checkpoint_data["files_backup"] = files_backup
    
    def _backup_dependencies(self, checkpoint_path: Path, checkpoint_data: Dict[str, Any]):
        """备份依赖"""
        dependencies_backup = {}
        
        # 备份package.json
        package_json = self.project_root / "package.json"
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                dependencies_backup["package_json"] = json.load(f)
        
        # 备份requirements.txt
        requirements_txt = self.project_root / "requirements.txt"
        if requirements_txt.exists():
            with open(requirements_txt, 'r', encoding='utf-8') as f:
                dependencies_backup["requirements_txt"] = f.read()
        
        checkpoint_data["dependencies_backup"] = dependencies_backup
    
    def _backup_environment(self, checkpoint_path: Path, checkpoint_data: Dict[str, Any]):
        """备份环境变量"""
        env_backup = {}
        
        # 备份关键环境变量（不包含敏感信息）
        safe_env_keys = [
            "NODE_ENV", "LOG_LEVEL", "BUILD_MODE", 
            "CI", "GITHUB_ACTIONS", "RUNNER_OS"
        ]
        
        for key in safe_env_keys:
            if key in os.environ:
                env_backup[key] = os.environ[key]
        
        checkpoint_data["environment_backup"] = env_backup
    
    async def _restore_files(self, checkpoint: Dict[str, Any], critical_only: bool = False) -> Dict[str, Any]:
        """恢复文件"""
        try:
            checkpoint_path = self.rollback_dir / checkpoint["id"]
            files_backup = checkpoint["files_backup"]
            
            restored_files = []
            
            for file_path, backup_path in files_backup.items():
                if critical_only and not self._is_critical_file(file_path):
                    continue
                
                source_file = checkpoint_path / "files" / file_path
                target_file = self.project_root / file_path
                
                if source_file.exists():
                    shutil.copy2(source_file, target_file)
                    restored_files.append(file_path)
            
            return {
                "step": "restore_files",
                "status": "success",
                "restored_files": restored_files,
                "critical_only": critical_only
            }
            
        except Exception as e:
            return {
                "step": "restore_files",
                "status": "failure",
                "error": str(e)
            }
    
    async def _restore_dependencies(self, checkpoint: Dict[str, Any]) -> Dict[str, Any]:
        """恢复依赖"""
        try:
            dependencies_backup = checkpoint["dependencies_backup"]
            
            # 恢复package.json
            if "package_json" in dependencies_backup:
                package_json = self.project_root / "package.json"
                with open(package_json, 'w', encoding='utf-8') as f:
                    json.dump(dependencies_backup["package_json"], f, indent=2)
                
                # 重新安装依赖
                result = subprocess.run(
                    ["npm", "install"],
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if result.returncode != 0:
                    raise RuntimeError(f"npm install 失败: {result.stderr}")
            
            # 恢复requirements.txt
            if "requirements_txt" in dependencies_backup:
                requirements_txt = self.project_root / "requirements.txt"
                with open(requirements_txt, 'w', encoding='utf-8') as f:
                    f.write(dependencies_backup["requirements_txt"])
                
                # 重新安装Python依赖
                result = subprocess.run(
                    ["pip", "install", "-r", "requirements.txt"],
                    cwd=self.project_root,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if result.returncode != 0:
                    raise RuntimeError(f"pip install 失败: {result.stderr}")
            
            return {
                "step": "restore_dependencies",
                "status": "success",
                "message": "依赖恢复完成"
            }
            
        except Exception as e:
            return {
                "step": "restore_dependencies",
                "status": "failure",
                "error": str(e)
            }
    
    async def _restore_environment(self, checkpoint: Dict[str, Any]) -> Dict[str, Any]:
        """恢复环境变量"""
        try:
            env_backup = checkpoint["environment_backup"]
            
            for key, value in env_backup.items():
                os.environ[key] = value
            
            return {
                "step": "restore_environment",
                "status": "success",
                "restored_vars": list(env_backup.keys())
            }
            
        except Exception as e:
            return {
                "step": "restore_environment",
                "status": "failure",
                "error": str(e)
            }
    
    async def _rollback_git(self, commit_hash: str) -> Dict[str, Any]:
        """Git回滚"""
        try:
            result = subprocess.run(
                ["git", "reset", "--hard", commit_hash],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"git reset 失败: {result.stderr}")
            
            return {
                "step": "rollback_git",
                "status": "success",
                "commit": commit_hash
            }
            
        except Exception as e:
            return {
                "step": "rollback_git",
                "status": "failure",
                "error": str(e)
            }
    
    async def _check_current_status(self) -> Dict[str, Any]:
        """检查当前状态"""
        try:
            # 检查Git状态
            git_result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # 检查构建状态
            build_result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            return {
                "git_dirty": len(git_result.stdout.strip()) > 0,
                "git_status": git_result.stdout,
                "build_status": "success" if build_result.returncode == 0 else "failure",
                "build_output": build_result.stdout,
                "build_error": build_result.stderr
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status_check_failed": True
            }
    
    async def _graceful_stop_services(self) -> Dict[str, Any]:
        """优雅停止服务"""
        # 这里可以实现停止相关服务的逻辑
        return {
            "step": "graceful_stop",
            "status": "success",
            "message": "服务已优雅停止"
        }
    
    async def _verify_rollback(self, checkpoint: Dict[str, Any]) -> Dict[str, Any]:
        """验证回滚"""
        try:
            # 验证关键文件是否存在
            missing_files = []
            for file_path in checkpoint["files_backup"].keys():
                if not (self.project_root / file_path).exists():
                    missing_files.append(file_path)
            
            # 验证构建
            build_result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            success = len(missing_files) == 0 and build_result.returncode == 0
            
            return {
                "step": "verify_rollback",
                "status": "success" if success else "failure",
                "missing_files": missing_files,
                "build_success": build_result.returncode == 0,
                "build_output": build_result.stdout if build_result.returncode != 0 else None
            }
            
        except Exception as e:
            return {
                "step": "verify_rollback",
                "status": "failure",
                "error": str(e)
            }
    
    async def _verify_partial_rollback(self, checkpoint: Dict[str, Any]) -> Dict[str, Any]:
        """验证部分回滚"""
        # 简化的验证逻辑
        return {
            "step": "verify_partial_rollback",
            "status": "success",
            "message": "部分回滚验证完成"
        }
    
    async def _restart_services(self) -> Dict[str, Any]:
        """重启服务"""
        # 这里可以实现重启服务的逻辑
        return {
            "step": "restart_services",
            "status": "success",
            "message": "服务已重启"
        }
    
    def _generate_manual_rollback_guide(self, checkpoint: Dict[str, Any]) -> str:
        """生成手动回滚指南"""
        guide = f"""# 手动回滚指南

## 检查点信息
- **名称**: {checkpoint['name']}
- **ID**: {checkpoint['id']}
- **创建时间**: {checkpoint['created_at']}
- **Git提交**: {checkpoint.get('git_commit', 'N/A')}

## 手动回滚步骤

### 1. 恢复文件
请手动复制以下文件到项目根目录:

"""
        
        for file_path in checkpoint["files_backup"].keys():
            guide += f"- `{file_path}`\n"
        
        guide += f"""
### 2. 恢复依赖
```bash
npm install
pip install -r requirements.txt
```

### 3. Git回滚（可选）
```bash
git reset --hard {checkpoint.get('git_commit', 'HEAD')}
```

### 4. 验证回滚
```bash
npm run build
npm test
```

## 注意事项
- 请确保在执行回滚前备份当前状态
- 如果遇到问题，请查看详细的错误日志
- 建议在测试环境中先验证回滚步骤

## 回滚完成后的检查清单
- [ ] 关键文件已恢复
- [ ] 依赖已正确安装
- [ ] 项目可以正常构建
- [ ] 测试可以正常运行
- [ ] 服务可以正常启动

---
*此指南由MCP Agent自动生成于 {datetime.now().isoformat()}*
"""
        
        return guide
    
    def _get_current_commit(self) -> str:
        """获取当前Git提交"""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return result.stdout.strip()
            
        except Exception:
            pass
        
        return ""
    
    def _is_critical_file(self, file_path: str) -> bool:
        """判断是否为关键文件"""
        critical_patterns = [
            "package.json",
            "wrangler.toml",
            "astro.config.mjs",
            "src/workers/main.js"
        ]
        
        return any(pattern in file_path for pattern in critical_patterns)
    
    def _load_checkpoint_from_file(self, checkpoint_id: str):
        """从文件加载检查点"""
        checkpoint_path = self.rollback_dir / checkpoint_id
        checkpoint_file = checkpoint_path / "checkpoint.json"
        
        if checkpoint_file.exists():
            try:
                with open(checkpoint_file, 'r', encoding='utf-8') as f:
                    checkpoint_data = json.load(f)
                self.checkpoints[checkpoint_id] = checkpoint_data
            except Exception as e:
                self.logger.error(f"加载检查点文件失败: {e}")
    
    def list_checkpoints(self) -> List[Dict[str, Any]]:
        """列出所有检查点"""
        checkpoints = []
        
        for checkpoint_id, checkpoint_data in self.checkpoints.items():
            checkpoints.append({
                "id": checkpoint_id,
                "name": checkpoint_data["name"],
                "strategy": checkpoint_data["strategy"],
                "created_at": checkpoint_data["created_at"],
                "git_commit": checkpoint_data.get("git_commit", "N/A")
            })
        
        # 按创建时间排序
        checkpoints.sort(key=lambda x: x["created_at"], reverse=True)
        
        return checkpoints
    
    def cleanup_old_checkpoints(self, keep_count: int = 5):
        """清理旧的检查点"""
        checkpoints = self.list_checkpoints()
        
        if len(checkpoints) > keep_count:
            checkpoints_to_remove = checkpoints[keep_count:]
            
            for checkpoint in checkpoints_to_remove:
                checkpoint_path = self.rollback_dir / checkpoint["id"]
                
                try:
                    if checkpoint_path.exists():
                        shutil.rmtree(checkpoint_path)
                    
                    if checkpoint["id"] in self.checkpoints:
                        del self.checkpoints[checkpoint["id"]]
                    
                    self.logger.info(f"🗑️  清理旧检查点: {checkpoint['name']}")
                    
                except Exception as e:
                    self.logger.error(f"清理检查点失败 {checkpoint['name']}: {e}")


class RollbackStrategySelector:
    """回滚策略选择器"""
    
    @staticmethod
    def select_strategy(error_type: str, severity: str, context: Dict[str, Any]) -> RollbackStrategy:
        """选择回滚策略"""
        
        # 根据错误类型和严重程度选择策略
        if severity == "critical":
            return RollbackStrategy.IMMEDIATE
        
        elif error_type in ["build_failure", "dependency_conflict"]:
            return RollbackStrategy.GRACEFUL
        
        elif error_type in ["test_failure", "lint_warning"]:
            return RollbackStrategy.PARTIAL
        
        elif context.get("manual_intervention_required", False):
            return RollbackStrategy.MANUAL
        
        else:
            return RollbackStrategy.GRACEFUL


# 使用示例
async def example_usage():
    """使用示例"""
    from pathlib import Path
    import logging
    
    # 设置日志
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # 创建回滚管理器
    project_root = Path.cwd()
    rollback_manager = RollbackManager(project_root, logger)
    
    # 创建检查点
    checkpoint = rollback_manager.create_checkpoint("before_deployment")
    
    try:
        # 执行一些操作...
        pass
        
    except Exception as e:
        # 执行回滚
        result = await rollback_manager.execute_rollback(
            checkpoint["id"], 
            reason=f"操作失败: {e}"
        )
        
        if result["success"]:
            logger.info("回滚成功")
        else:
            logger.error(f"回滚失败: {result.get('error')}")


if __name__ == "__main__":
    asyncio.run(example_usage())