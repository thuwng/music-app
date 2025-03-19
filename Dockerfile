FROM node:18

# Thiết lập thư mục làm việc cho backend
WORKDIR /app/backend

# Copy package.json và cài đặt dependencies cho backend
COPY backend/package*.json ./
RUN npm install

# Copy toàn bộ code backend
COPY backend/ ./

# Thiết lập thư mục làm việc cho frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install && npm run build

# Quay lại thư mục backend để chạy server
WORKDIR /app/backend
EXPOSE 5000
CMD ["node", "server.js"]