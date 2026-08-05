FROM node:20.11.1-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit

COPY . .

ARG VUE_APP_OAUTH_SERVER_URL=http://127.0.0.1:8090
ARG VUE_APP_OAUTH_CLIENT_ID=
ARG VUE_APP_OAUTH_CLIENT_SECRET=
ARG VUE_APP_OAUTH_REDIRECT_URI=
ARG VUE_APP_OAUTH_SCOPE=read write

ENV VUE_APP_OAUTH_SERVER_URL=$VUE_APP_OAUTH_SERVER_URL \
    VUE_APP_OAUTH_CLIENT_ID=$VUE_APP_OAUTH_CLIENT_ID \
    VUE_APP_OAUTH_CLIENT_SECRET=$VUE_APP_OAUTH_CLIENT_SECRET \
    VUE_APP_OAUTH_REDIRECT_URI=$VUE_APP_OAUTH_REDIRECT_URI \
    VUE_APP_OAUTH_SCOPE=$VUE_APP_OAUTH_SCOPE

RUN npm run build

FROM nginx:1.24.0-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
