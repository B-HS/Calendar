FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=sveltekit:nodejs build ./build
COPY --chown=sveltekit:nodejs .env ./.env

USER sveltekit

EXPOSE 3000

CMD ["node", "build/index.js"]
