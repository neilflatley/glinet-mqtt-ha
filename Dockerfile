FROM node:20-alpine
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY src src
EXPOSE 3000
CMD [ "npm", "run", "src"]