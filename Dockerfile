FROM node:17

WORKDIR /usr/app

COPY src /usr/app/src
COPY package*.json ./
COPY tsconfig.json ./
COPY config.json ./

RUN npm install
RUN npm run build

CMD ["node", "dist/comobot.js"]