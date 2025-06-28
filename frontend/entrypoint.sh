#!/bin/sh

# Заменяем переменные окружения в env-config.js
envsubst < /usr/share/nginx/html/env-config.js.tpl > /usr/share/nginx/html/env-config.js

# Запускаем nginx
exec "$@" 