FROM nginx:1.24.0-alpine
EXPOSE 80
COPY ./dist /usr/share/nginx/html
