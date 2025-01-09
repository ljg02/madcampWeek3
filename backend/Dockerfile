FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn install

COPY . .

# Cloud Run에서 기본적으로 PORT=8080을 할당받습니다.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
