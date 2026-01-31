# 步纹 (Buwen) - 树莓派部署指南

## 📋 目录
1. [本地开发运行](#本地开发运行)
2. [构建生产版本](#构建生产版本)
3. [树莓派部署方案](#树莓派部署方案)
4. [常见问题](#常见问题)

---

## 本地开发运行

### 1. 安装依赖

```bash
cd buwen
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

---

## 构建生产版本

### 方案一：直接构建运行（推荐用于树莓派）

```bash
# 构建
npm run build

# 运行生产服务器
npm run start
```

### 方案二：使用 Docker（可选）

如果你的树莓派已安装 Docker：

```bash
# 构建镜像
docker build -t buwen .

# 运行容器
docker run -d -p 3000:3000 --name buwen buwen
```

或使用 docker-compose：

```bash
docker compose up -d
```

---

## 树莓派部署方案

### 前提条件

1. 树莓派安装了 Raspberry Pi OS (64位推荐)
2. 已连接到局域网并有固定IP或已设置mDNS
3. 安装了 Node.js 20.x

### 步骤一：在树莓派上安装 Node.js

```bash
# 使用 NodeSource 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # 应显示 v20.x.x
npm -v
```

### 步骤二：传输项目到树莓派

**方法 A：使用 SCP（推荐）**

在你的 Mac 上运行：

```bash
# 假设树莓派IP为 192.168.1.100，用户名为 pi
scp -r /Users/xiaochutan/data/Personal-projects/projects/new_scheduler/buwen pi@192.168.1.100:~/
```

**方法 B：使用 Git**

如果项目在 Git 仓库中：

```bash
# 在树莓派上
git clone <你的仓库地址>
cd buwen
```

### 步骤三：在树莓派上构建和运行

```bash
# 进入项目目录
cd ~/buwen

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务（临时测试）
npm run start
```

### 步骤四：设置开机自启动（使用 PM2）

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "buwen" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤五：访问应用

在局域网内的任何设备上，打开浏览器访问：

```
http://<树莓派IP地址>:3000
```

例如：`http://192.168.1.100:3000`

---

## 高级配置

### 使用 Nginx 反向代理（可选）

如果你想使用 80 端口或添加 HTTPS：

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/buwen
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name buwen.local;  # 或你的树莓派IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/buwen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 使用 mDNS（可选）

让你可以通过 `http://buwen.local` 访问：

```bash
# 树莓派通常已安装 avahi
sudo apt install avahi-daemon

# 编辑主机名
sudo hostnamectl set-hostname buwen

# 重启 avahi
sudo systemctl restart avahi-daemon
```

然后在局域网内可以通过 `http://buwen.local:3000` 访问。

---

## 常见问题

### Q: 构建时内存不足？

树莓派内存有限，可以增加 swap：

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# 将 CONF_SWAPSIZE 改为 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Q: 如何查看日志？

```bash
# 使用 PM2
pm2 logs buwen

# 实时查看
pm2 logs buwen --lines 100
```

### Q: 如何更新应用？

```bash
# 拉取最新代码或重新传输文件
cd ~/buwen
npm install
npm run build
pm2 restart buwen
```

### Q: 如何完全停止服务？

```bash
pm2 stop buwen
pm2 delete buwen
```

---

## 数据持久化

应用数据目前存储在浏览器的 localStorage 中，每个浏览器的数据是独立的。

如果需要跨设备同步数据，未来可以接入 Supabase 等后端服务。

---

## 技术栈

- **前端框架**: Next.js 14 (React)
- **状态管理**: Zustand (持久化到 localStorage)
- **拖拽库**: @dnd-kit
- **样式**: Tailwind CSS
- **日期处理**: date-fns
- **图标**: Lucide React

---

*部署指南版本: v1.0*
