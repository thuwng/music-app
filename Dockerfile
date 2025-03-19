FROM node:16

WORKDIR /app

COPY . .

RUN cd backend && npm install
RUN cd frontend && npm install && npm run build

EXPOSE 5000

CMD ["node", "backend/server.js"]