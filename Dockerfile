FROM node:20-alpine AS base 
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
FROM base as builder
WORKDIR /usr/src/app
RUN npm run build
FROM node:20-alpine 
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./
EXPOSE 3000
CMD [ "npm", "run", "server"]