#!/bin/bash
set -e # Exit on any error

echo "Starting deployment audit log generation..."

# 获取当前部署的相关信息
COMMIT_SHA=$(git rev-parse HEAD)
DEPLOYER=$(git config user.name)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
WORKFLOW_RUN_ID=$GITHUB_RUN_ID
REPOSITORY=$GITHUB_REPOSITORY
REF=$GITHUB_REF

# 生成部署审计日志
cat > deployment-audit.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "event_type": "deployment",
  "commit_sha": "$COMMIT_SHA",
  "deployer": "$DEPLOYER",
  "workflow_run_id": "$WORKFLOW_RUN_ID",
  "repository": "$REPOSITORY",
  "ref": "$REF",
  "environment": "${1:-production}",
  "worker_version": "1.1"
}
EOF

echo "Deployment audit log generated successfully!"
cat deployment-audit.json

# 在部署成功后可以将审计日志上传到日志服务
# 这里简化处理，实际应用中可以把日志发送到专门的日志分析服务

echo "Deployment audit completed."