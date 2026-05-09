FROM node:24-alpine AS builder 
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist

FROM gcr.io/distroless/nodejs24-debian13
COPY --from=base /usr/src/app /app
WORKDIR /app
ENV MALLOC_ARENA_MAX=1
EXPOSE 3000
CMD [ "dist/app.js"]
