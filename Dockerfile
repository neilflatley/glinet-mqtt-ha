FROM node:20-alpine AS builder 
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=base /usr/src/app /app
WORKDIR /app
EXPOSE 3000
CMD [ "dist/app.js"]
