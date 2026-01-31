#!/bin/bash

# =============================================================================
# 步纹 (Buwen) - 更新脚本
# 
# 使用方法：
#   ./update.sh
#
# 功能：
#   - 拉取最新代码
#   - 安装新依赖（如有）
#   - 重新构建
#   - 重启服务
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="buwen"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}[INFO]${NC} 开始更新步纹 (Buwen)..."

# 切换到项目目录
cd "$APP_DIR"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}[WARN]${NC} 检测到本地更改，正在暂存..."
    git stash
    STASHED=true
else
    STASHED=false
fi

# 拉取最新代码
echo -e "${BLUE}[INFO]${NC} 拉取最新代码..."
git pull origin main

# 恢复暂存的更改
if [ "$STASHED" = true ]; then
    echo -e "${BLUE}[INFO]${NC} 恢复本地更改..."
    git stash pop || true
fi

# 安装依赖
echo -e "${BLUE}[INFO]${NC} 检查并安装依赖..."
npm install

# 构建
echo -e "${BLUE}[INFO]${NC} 重新构建..."
export NODE_OPTIONS="--max-old-space-size=400"
npm run build

# 复制静态文件
if [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/ 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
fi

# 重启服务
echo -e "${BLUE}[INFO]${NC} 重启服务..."
sudo systemctl restart $APP_NAME

# 等待启动
sleep 3

# 检查状态
if sudo systemctl is-active --quiet $APP_NAME; then
    echo -e "${GREEN}[OK]${NC} 更新完成，服务已重启！"
else
    echo -e "${RED}[ERROR]${NC} 服务启动失败"
    sudo journalctl -u $APP_NAME -n 20 --no-pager
    exit 1
fi
