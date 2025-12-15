# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
WORKDIR /app/client
RUN npm run build

# 构建后端
WORKDIR /app/server
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 复制package.json文件
COPY server/package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/client/dist ./client/dist

# 生成Prisma客户端
RUN npx prisma generate

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S arkok -u 1001

# 设置文件权限
RUN chown -R arkok:nodejs /app
USER arkok

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]