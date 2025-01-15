# 공식 Node.js LTS 이미지를 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN yarn install

# 나머지 애플리케이션 코드 복사
COPY . .

# Cloud Run에서 기본적으로 PORT=8080을 할당받음
ENV PORT=8080
# 애플리케이션이 사용하는 포트 노출
EXPOSE 8080


# 애플리케이션 실행 명령어 정의
CMD ["node", "gameServer.js"]
