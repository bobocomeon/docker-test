# build stage
FROM node:lts-alpine as build-stage
# 将工作区设为 /app
WORKDIR /app
# 拷贝到工作区
COPY package*.json ./
RUN npm install
# 拷贝其他文件到容器/app目录，分两次拷贝是因为保持node_modules一致
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
# 通过--form参数可以引用build-stage阶段生成产物复制到/usr/share/nginx/html
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 对外暴露8008端口
EXPOSE 8008
# 容器创建的时候运行nginx -g daemon off命令，一旦命令介绍，容器销毁
CMD ["nginx", "-g" "daemon off;"]
