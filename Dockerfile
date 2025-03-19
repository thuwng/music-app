# Sử dụng image Node.js 20
FROM node:20

# Tạo và đặt thư mục làm việc cho backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Tạo và đặt thư mục làm việc cho frontend
WORKDIR /app/frontend
# Sao chép toàn bộ thư mục frontend (bao gồm public/, src/, v.v.)
COPY frontend/ ./
RUN npm install && npm run build

# Quay lại thư mục backend để chạy server
WORKDIR /app/backend
CMD ["npm", "start"]