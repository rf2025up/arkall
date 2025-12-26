# 使用 Node.js 18 Alpine 镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY arkok-v2/server/package*.json ./
COPY arkok-v2/client/package*.json ../client/

# 安装依赖
RUN cd server && npm install --production
RUN cd ../client && npm install

# 复制源代码
COPY arkok-v2/server/ ./server/
COPY arkok-v2/client/ ../client/

# 构建客户端
RUN cd ../client && npm run build

# 构建服务器 (跳过类型检查)
RUN cd server && npx tsc --skipLibCheck

# 生成 Prisma 客户端
RUN cd server && npx prisma generate

# 复制客户端构建文件到服务器公共目录
RUN mkdir -p server/public && cp -r ../client/dist/* server/public/

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
WORKDIR /app/server
CMD ["npm", "start"]