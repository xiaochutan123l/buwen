# 步纹 (Buwen) - 部署指南

## 📋 目录
1. [本地开发运行](#本地开发运行)
2. [构建生产版本](#构建生产版本)
3. [树莓派部署方案](#树莓派部署方案)
4. [云服务器 Docker 部署](#云服务器-docker-部署)
5. [云服务器多站点部署](#云服务器多站点部署)
6. [更新应用](#更新应用)
7. [数据迁移](#数据迁移)
8. [常见问题](#常见问题)

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

## 云服务器多站点部署

> **适用场景**：服务器上已有其他网站（如个人博客在 8080 端口），想同时部署步纹

### 方案一：使用不同端口 + Nginx 反向代理（推荐）

假设你的服务器已有：
- 个人网站：`yourdomain.com` → 端口 8080
- 现在要添加步纹：`buwen.yourdomain.com` → 端口 3000

**步骤 1：部署步纹到 3000 端口**

```bash
# 克隆项目
git clone https://github.com/xiaochutan123l/buwen.git
cd buwen

# Docker 部署（默认 3000 端口）
docker compose up -d --build

# 或者非 Docker 部署
npm install && npm run build
pm2 start npm --name "buwen" -- start
```

**步骤 2：配置 Nginx 反向代理**

```bash
sudo nano /etc/nginx/sites-available/buwen
```

添加配置：

```nginx
server {
    listen 80;
    server_name buwen.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**步骤 3：启用配置并申请 HTTPS**

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/buwen /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx

# 使用 Certbot 申请免费 SSL 证书
sudo certbot --nginx -d buwen.yourdomain.com
```

**步骤 4：DNS 配置**

在你的域名服务商添加 A 记录：
```
buwen.yourdomain.com → 你的服务器IP
```

现在可以通过 `https://buwen.yourdomain.com` 访问步纹了！

### 方案二：使用子路径

如果不想用子域名，可以把步纹放在主站的子路径下，如 `yourdomain.com/buwen`

```nginx
# 在现有的 server 块中添加
location /buwen/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

> ⚠️ 注意：Next.js 需要配置 basePath，修改 `next.config.js`：
> ```js
> module.exports = { basePath: '/buwen' }
> ```

### 方案三：使用不同端口直接访问

最简单但不推荐用于生产：

```bash
# 修改 docker-compose.yml 使用其他端口如 3001
ports:
  - "3001:3000"
```

然后通过 `http://yourdomain.com:3001` 访问（需要在防火墙开放端口）

---

## 更新应用

### Docker 部署更新

```bash
cd buwen

# 拉取最新代码
git pull origin main

# 重新构建并启动（数据会保留）
docker compose up -d --build

# 清理旧镜像（可选）
docker image prune -f
```

### 非 Docker 部署更新

**方法一：使用 update.sh 脚本**

```bash
cd buwen
./update.sh
```

**方法二：手动更新**

```bash
cd buwen

# 拉取最新代码
git pull origin main

# 安装依赖（如果有新依赖）
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart buwen
```

### 更新时数据会丢失吗？

**不会！** 数据保存在 `data/buwen-data.json` 文件中：
- Docker：通过 volumes 挂载，容器重建数据不丢失
- 非 Docker：数据在项目目录下，git pull 不会覆盖

### 适用场景

- 阿里云、腾讯云、AWS、Azure 等云服务器
- 已安装 Docker 和 Docker Compose 的 Linux 服务器
- NAS 设备（群晖、威联通等）

### 快速部署（3 步完成）

**步骤 1：克隆项目**

```bash
git clone https://github.com/xiaochutan123l/buwen.git
cd buwen
```

**步骤 2：构建并启动**

```bash
# 使用 Docker Compose 一键部署
docker compose up -d --build
```

**步骤 3：访问应用**

打开浏览器访问 `http://<服务器IP>:3000`

### Docker 命令详解

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build

# 进入容器内部（调试用）
docker exec -it buwen sh
```

### 修改端口

编辑 `docker-compose.yml`：

```yaml
services:
  buwen:
    build: .
    ports:
      - "8080:3000"  # 改为你想要的端口
```

### 使用 Nginx 反向代理 + HTTPS

推荐在 Docker 外部使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name buwen.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name buwen.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 数据迁移

### 数据存储位置

步纹的数据存储在**服务器端**的 `data/buwen-data.json` 文件中，这意味着：
- ✅ 所有访问同一服务器的设备共享数据
- ✅ 手机、平板、电脑访问同一服务器即可同步
- ✅ 数据迁移只需复制 `data/` 目录
- ⚠️ 换服务器时需要迁移 `data/` 目录

### 方法一：复制 data 目录（推荐）

迁移到新服务器时，只需复制 `data/` 目录：

```bash
# 在旧服务器上
scp -r /path/to/buwen/data user@new-server:/path/to/buwen/

# 或者用 rsync
rsync -av /path/to/buwen/data/ user@new-server:/path/to/buwen/data/
```

### 方法二：使用内置导出/导入功能

1. **导出数据**
   - 打开设置 ⚙️
   - 点击「导出数据」按钮
   - 保存 `buwen-backup-YYYY-MM-DD.json` 文件

2. **导入数据**
   - 在新服务器上打开步纹
   - 打开设置 ⚙️
   - 点击「导入数据」按钮
   - 选择之前导出的 JSON 文件
   - 页面会自动刷新加载数据

### Docker 部署的数据持久化

使用 Docker 时，建议挂载数据目录：

```yaml
# docker-compose.yml
services:
  buwen:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # 持久化数据
    restart: unless-stopped
```

这样即使容器重建，数据也不会丢失。

### 迁移场景示例

| 场景 | 方法 |
|------|------|
| 树莓派 → 云服务器 | 复制 data 目录或使用导出/导入 |
| 本地 → Docker | 复制 data 目录到挂载路径 |
| 备份数据 | 定期导出 JSON 或备份 data 目录 |

---

## 技术栈

- **前端框架**: Next.js 14 (React)
- **状态管理**: Zustand (服务器端持久化)
- **数据存储**: JSON 文件 (服务器端 `data/buwen-data.json`)
- **拖拽库**: @dnd-kit
- **样式**: Tailwind CSS
- **日期处理**: date-fns
- **图标**: Lucide React

---

*部署指南版本: v2.0*
