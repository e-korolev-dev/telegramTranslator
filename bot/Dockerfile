FROM node:18-alpine

WORKDIR /app

COPY package.dev.json package.json

RUN npm install

COPY . .

COPY package.dev.json package.json

CMD ["npm", "run", "start:dev"]
