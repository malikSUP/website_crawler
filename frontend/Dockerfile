# ---------------------------
# Этап 1: Сборка приложения
# ---------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files для лучшего кеширования
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# ---------------------------
# Этап 2: Продакшн с Nginx
# ---------------------------
FROM nginx:alpine

# Устанавливаем envsubst для подстановки переменных окружения
RUN apk add --no-cache gettext

# Копируем собранное приложение из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный nginx конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем шаблон env-config.js и entrypoint скрипт
COPY public/env-config.js.tpl /usr/share/nginx/html/env-config.js.tpl
COPY entrypoint.sh /entrypoint.sh

# Делаем entrypoint скрипт исполняемым
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 