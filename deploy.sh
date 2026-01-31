#!/bin/bash

# =============================================================================
# 步纹 (Buwen) - 树莓派一键部署脚本
# 
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh
#
# 功能：
#   - 安装 Node.js (如果未安装)
#   - 安装依赖
#   - 构建生产版本
#   - 创建 systemd 服务（开机自启）
#   - 启动服务
#
# 适用于：Raspberry Pi Zero 2W / Pi 3 / Pi 4 / Pi 5
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
APP_NAME="buwen"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_VERSION="20"
PORT=3000

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           步纹 (Buwen) - 一键部署脚本                       ║"
echo "║           Anti-anxiety Project Management App              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查是否为 root 用户（某些操作需要 sudo）
check_sudo() {
    if [ "$EUID" -ne 0 ]; then
        SUDO="sudo"
    else
        SUDO=""
    fi
}

# 检测系统架构
detect_arch() {
    ARCH=$(uname -m)
    echo -e "${BLUE}[INFO]${NC} 检测到系统架构: $ARCH"
    
    case $ARCH in
        armv7l|armv6l)
            NODE_ARCH="armv7l"
            ;;
        aarch64|arm64)
            NODE_ARCH="arm64"
            ;;
        x86_64)
            NODE_ARCH="x64"
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} 不支持的架构: $ARCH"
            exit 1
            ;;
    esac
}

# 检查并安装 Node.js
install_nodejs() {
    echo -e "${BLUE}[INFO]${NC} 检查 Node.js..."
    
    if command -v node &> /dev/null; then
        CURRENT_NODE=$(node -v)
        echo -e "${GREEN}[OK]${NC} Node.js 已安装: $CURRENT_NODE"
        
        # 检查版本是否 >= 18
        NODE_MAJOR=$(echo $CURRENT_NODE | cut -d'.' -f1 | tr -d 'v')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            echo -e "${YELLOW}[WARN]${NC} Node.js 版本过低，需要 >= 18"
            NEED_INSTALL=true
        else
            NEED_INSTALL=false
        fi
    else
        echo -e "${YELLOW}[WARN]${NC} Node.js 未安装"
        NEED_INSTALL=true
    fi
    
    if [ "$NEED_INSTALL" = true ]; then
        echo -e "${BLUE}[INFO]${NC} 正在安装 Node.js $NODE_VERSION..."
        
        # 使用 NodeSource 安装
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | $SUDO bash -
        $SUDO apt-get install -y nodejs
        
        echo -e "${GREEN}[OK]${NC} Node.js 安装完成: $(node -v)"
    fi
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}[INFO]${NC} 安装项目依赖..."
    
    cd "$APP_DIR"
    
    # 清理旧的 node_modules（如果存在问题）
    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}[INFO]${NC} 发现现有 node_modules，跳过重新安装"
        echo -e "${YELLOW}[INFO]${NC} 如需重新安装，请先运行: rm -rf node_modules"
    else
        npm install --production=false
        echo -e "${GREEN}[OK]${NC} 依赖安装完成"
    fi
}

# 构建项目
build_project() {
    echo -e "${BLUE}[INFO]${NC} 构建生产版本..."
    
    cd "$APP_DIR"
    
    # 设置 Node.js 内存限制（适合低内存设备）
    export NODE_OPTIONS="--max-old-space-size=400"
    
    npm run build
    
    echo -e "${GREEN}[OK]${NC} 构建完成"
}

# 创建 systemd 服务
create_service() {
    echo -e "${BLUE}[INFO]${NC} 创建 systemd 服务..."
    
    SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
    
    $SUDO tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Buwen - Anti-anxiety Project Management App
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$(which node) $APP_DIR/.next/standalone/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=0.0.0.0

# 内存限制（适合 Pi Zero 2W）
MemoryMax=400M

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载 systemd
    $SUDO systemctl daemon-reload
    
    # 启用开机自启
    $SUDO systemctl enable $APP_NAME
    
    echo -e "${GREEN}[OK]${NC} 服务创建完成"
}

# 复制静态文件到 standalone 目录
copy_static_files() {
    echo -e "${BLUE}[INFO]${NC} 复制静态文件..."
    
    cd "$APP_DIR"
    
    # standalone 模式需要手动复制 public 和 static 文件
    if [ -d ".next/standalone" ]; then
        cp -r public .next/standalone/ 2>/dev/null || true
        cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
        echo -e "${GREEN}[OK]${NC} 静态文件复制完成"
    fi
}

# 启动服务
start_service() {
    echo -e "${BLUE}[INFO]${NC} 启动服务..."
    
    $SUDO systemctl restart $APP_NAME
    
    # 等待启动
    sleep 3
    
    # 检查状态
    if $SUDO systemctl is-active --quiet $APP_NAME; then
        echo -e "${GREEN}[OK]${NC} 服务启动成功！"
    else
        echo -e "${RED}[ERROR]${NC} 服务启动失败，查看日志："
        $SUDO journalctl -u $APP_NAME -n 20 --no-pager
        exit 1
    fi
}

# 获取 IP 地址
get_ip() {
    IP=$(hostname -I | awk '{print $1}')
    echo "$IP"
}

# 显示完成信息
show_complete() {
    IP=$(get_ip)
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 部署完成！                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  访问地址: ${BLUE}http://${IP}:${PORT}${NC}"
    echo -e "  本地访问: ${BLUE}http://localhost:${PORT}${NC}"
    echo ""
    echo -e "  ${YELLOW}常用命令：${NC}"
    echo -e "    查看状态:  sudo systemctl status $APP_NAME"
    echo -e "    查看日志:  sudo journalctl -u $APP_NAME -f"
    echo -e "    重启服务:  sudo systemctl restart $APP_NAME"
    echo -e "    停止服务:  sudo systemctl stop $APP_NAME"
    echo ""
    echo -e "  ${YELLOW}更新应用：${NC}"
    echo -e "    cd $APP_DIR"
    echo -e "    ./update.sh"
    echo ""
}

# 主流程
main() {
    check_sudo
    detect_arch
    install_nodejs
    install_dependencies
    build_project
    copy_static_files
    create_service
    start_service
    show_complete
}

# 运行
main
