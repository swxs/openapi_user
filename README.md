# openapi_password

- [openapi\_password](#openapi_password)
  - [Project setup](#project-setup)
    - [Compiles and hot-reloads for development](#compiles-and-hot-reloads-for-development)
    - [Compiles and minifies for production](#compiles-and-minifies-for-production)
    - [Run your tests](#run-your-tests)
    - [Lints and fixes files](#lints-and-fixes-files)
    - [Customize configuration](#customize-configuration)

## Project setup

``` sh
npm install
```

### Compiles and hot-reloads for development

``` sh
npm run serve
```

### Compiles and minifies for production

``` sh
npm run build
```

### Run your tests

``` sh
npm run test
```

### Lints and fixes files

``` sh
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## 部署

镜像使用多阶段构建：在 Docker 内完成 `npm ci` 与 `npm run build`，最终只保留 Nginx 与静态资源。

本地构建可参考 `.env.production.example`，通过 `--build-arg` 传入 OAuth 等变量：

```powershell
docker build `
  --build-arg VUE_APP_OAUTH_SERVER_URL=http://127.0.0.1:8090 `
  --build-arg VUE_APP_OAUTH_CLIENT_ID=your-client-id `
  --build-arg VUE_APP_OAUTH_CLIENT_SECRET=your-client-secret `
  --build-arg VUE_APP_OAUTH_REDIRECT_URI=http://127.0.0.1:8083/oauth/callback `
  -t openapi-user .
docker run --rm -p 8083:80 openapi-user
```
