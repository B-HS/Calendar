FROM node:22-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV API_PORT=4000

RUN npm install -g bun

COPY apps/web/build ./apps/web/build
COPY apps/web/package.json ./apps/web/

COPY apps/api ./apps/api

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000 4000

CMD ["./start.sh"]
