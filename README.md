# Website Contact Information Crawler

> **Тестовое задание для компании Leadsup**

Система для автоматического извлечения контактной информации с веб-сайтов. Позволяет парсить как отдельные сайты, так и множество сайтов через поиск Google.

## 🚀 Основные возможности

- **Одиночный парсинг**: Извлечение контактов с конкретного сайта
- **Батч-парсинг**: Поиск и парсинг множества сайтов по запросу
- **AI-валидация**: Умная проверка контактных форм с помощью OpenAI
- **Экспорт данных**: Выгрузка результатов в CSV формате
- **Веб-интерфейс**: Современный React UI для управления
- **Отслеживание задач**: Система мониторинга прогресса парсинга

## 🏗️ Архитектура проекта

```
websites_crawler/
├── backend/          # FastAPI сервер
├── frontend/         # React приложение  
├── docker-compose.yml # Оркестрация контейнеров
└── env.example       # Пример конфигурации
```

### Технологический стек

**Backend:**
- FastAPI - REST API
- PostgreSQL - База данных
- SQLAlchemy - ORM
- BeautifulSoup - HTML парсинг
- OpenAI API - AI валидация форм
- Google Search API - Поиск сайтов

**Frontend:**
- React + TypeScript
- Tailwind CSS - Стилизация
- Vite - Сборщик
- Lucide React - Иконки

**DevOps:**
- Docker & Docker Compose
- Nginx - Веб-сервер для фронтенда
- Alembic - Миграции БД

## ⚡ Быстрый старт

### Запуск через Docker (рекомендуется)

1. **Клонируйte репозиторий:**
```bash
git clone <repository-url>
cd websites_crawler
```

2. **Настройте переменные окружения:**
```bash
cp env.example .env
# Отредактируйте .env файл с вашими API ключами
```

3. **Запустите все сервисы:**
```bash
docker-compose up -d
```

4. **Откройте приложение:**
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Локальная разработка

Для разработки каждый компонент можно запускать отдельно:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**База данных:**
```bash
docker run -d \
  -e POSTGRES_DB=crawler_db \
  -e POSTGRES_USER=crawler_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15-alpine
```

## 🔧 Конфигурация

Создайте `.env` файл на основе `env.example`:

```env
# API ключи
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key  
GOOGLE_CX=your_google_cx

# Сервер
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG_MODE=true

# База данных (для локальной разработки)
DATABASE_URL=postgresql://user:password@localhost:5432/crawler_db

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

### Получение API ключей

1. **OpenAI API**: https://platform.openai.com/api-keys
2. **Google Search API**: https://console.cloud.google.com/
   - Включите Custom Search API
   - Создайте Custom Search Engine

## 📊 Использование

### Одиночный парсинг
1. Введите URL сайта
2. Выберите настройки (sitemap, AI валидация)
3. Запустите парсинг
4. Получите результаты с email'ами и формами

### Батч-парсинг
1. Введите поисковый запрос
2. Укажите количество сайтов
3. Система найдет сайты через Google
4. Автоматически обработает каждый сайт
5. Экспортируйте результаты в CSV

## 🔍 API Endpoints

- `GET /` - Информация о API
- `POST /api/parse/single` - Парсинг одного сайта
- `POST /api/parse/batch` - Батч-парсинг
- `GET /api/task/{task_id}/status` - Статус задачи
- `GET /api/task/{task_id}/sites` - Результаты задачи
- `GET /api/task/{task_id}/export/csv` - Экспорт в CSV
- `DELETE /api/task/{task_id}` - Удаление задачи
- `GET /api/tasks` - Список всех задач

Полная документация API: http://localhost:8000/docs

## 🛠️ Команды разработчика

```bash
# Запуск тестов
cd backend && python -m pytest

# Миграции БД
cd backend && alembic upgrade head

# Линтинг frontend
cd frontend && npm run lint

# Сборка производственной версии
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Логирование

Логи сохраняются в:
- Backend: `backend/logs/`
- Docker volume: `backend_logs`

Уровни логирования настраиваются через `LOG_LEVEL` в `.env`.

## 🚦 Мониторинг

- Health check endpoints для Docker
- Статус задач в реальном времени
- Метрики производительности в логах

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 🆘 Поддержка

Если у вас возникли вопросы или проблемы:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь что все переменные окружения настроены
3. Проверьте что API ключи валидны
4. Создайте issue в репозитории 