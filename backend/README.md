# Backend - Website Contact Parser API

FastAPI приложение для извлечения контактной информации с веб-сайтов.

## 🏗️ Архитектура

```
backend/
├── app.py              # Основное FastAPI приложение
├── parser.py           # Основной парсер сайтов
├── batch_parser.py     # Батч-парсинг через Google Search
├── form_analyzer.py    # Анализ контактных форм с AI
├── sitemap_parser.py   # Парсинг sitemap.xml
├── google_search.py    # Интеграция с Google Search API
├── database.py         # Модели БД и конфигурация
├── schemas.py          # Pydantic схемы для API
├── task_service.py     # Сервис управления задачами
├── config.py           # Конфигурация приложения
├── logging_handler.py  # Система логирования
├── main.py            # Точка входа
├── requirements.txt    # Python зависимости
├── Dockerfile         # Docker образ
└── alembic/           # Миграции БД
```

## 🚀 Функциональность

### Основные возможности
- **Извлечение email адресов** из HTML контента и mailto ссылок
- **Обнаружение контактных форм** с умной оценкой релевантности
- **AI валидация форм** через OpenAI API
- **Парсинг sitemap.xml** для полного покрытия сайта
- **Батч-обработка** множества сайтов
- **Система задач** с отслеживанием прогресса
- **Экспорт результатов** в CSV формат

### Алгоритм парсинга
1. Загрузка главной страницы сайта
2. Поиск приоритетных URL (контакты, о нас, поддержка)
3. Парсинг sitemap.xml для дополнительных URL
4. Обработка каждой страницы:
   - Извлечение email адресов
   - Поиск и анализ форм
   - AI валидация форм (опционально)
5. Сохранение результатов в БД

## 🔧 Установка и запуск

### Docker (рекомендуется)

```bash
# Из корневой директории проекта
docker-compose up backend postgres
```

### Локальная разработка

1. **Установка зависимостей:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. **Настройка переменных окружения:**
```bash
cp ../env.example .env
# Отредактируйте .env файл
```

3. **Запуск PostgreSQL:**
```bash
docker run -d \
  -e POSTGRES_DB=crawler_db \
  -e POSTGRES_USER=crawler_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  --name postgres_crawler \
  postgres:15-alpine
```

4. **Применение миграций:**
```bash
alembic upgrade head
```

5. **Запуск сервера:**
```bash
python main.py
# или
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## 📋 API Endpoints

### Парсинг

**POST /api/parse/single** - Парсинг одного сайта
```json
{
  "url": "https://example.com",
  "skip_sitemap": false,
  "use_ai_validation": true
}
```

**POST /api/parse/batch** - Батч-парсинг
```json
{
  "query": "python development companies",
  "num_results": 10,
  "skip_sitemap": false,
  "use_ai_validation": true
}
```

### Управление задачами

**GET /api/task/{task_id}/status** - Статус задачи
```json
{
  "id": "uuid",
  "task_type": "single_site",
  "status": "completed",
  "created_at": "2024-01-01T10:00:00Z",
  "completed_at": "2024-01-01T10:05:00Z"
}
```

**GET /api/task/{task_id}/sites** - Результаты парсинга
```json
[
  {
    "domain": "example.com",
    "url": "https://example.com",
    "status": "success",
    "emails": ["contact@example.com"],
    "contact_forms": ["/contact"],
    "processing_time": 15
  }
]
```

**GET /api/task/{task_id}/export/csv** - Экспорт в CSV

**DELETE /api/task/{task_id}** - Удаление задачи

**GET /api/tasks** - Список всех задач

## 🔍 Конфигурация

### Основные настройки (config.py)

```python
# Лимиты парсинга
max_sitemaps = 5
max_urls_per_sitemap = 1000
max_urls_to_process = 50

# Таймауты
timeout = (3, 10)  # connection, read

# AI валидация
form_score_threshold = 5
ENABLE_AI_VERIFICATION = True
```

### Переменные окружения

```env
# API ключи
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
GOOGLE_CX=your_search_engine_id

# Сервер
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG_MODE=true

# База данных
DATABASE_URL=postgresql://user:pass@host:5432/db

# Логирование
LOG_LEVEL=INFO
```

## 🗄️ База данных

### Модели

**Task** - Задачи парсинга
- id (UUID)
- task_type (single_site, batch_parse)
- status (running, completed, failed)
- parameters (JSON)
- created_at, completed_at
- error_message

**ParsedSite** - Результаты парсинга сайтов
- task_id (FK to Task)
- domain, url, title, snippet
- status, emails (JSON), contact_forms (JSON)
- parsed_at, error_message, processing_time

### Миграции

```bash
# Создание новой миграции
alembic revision --autogenerate -m "Description"

# Применение миграций
alembic upgrade head

# Откат
alembic downgrade -1
```

## 🧪 Тестирование

```bash
# Установка dev зависимостей
pip install pytest pytest-asyncio httpx

# Запуск тестов
python -m pytest

# С покрытием
python -m pytest --cov=.
```

## 📊 Мониторинг и логирование

### Логи
- Структурированное логирование с timestamp и уровнями
- Отдельные логгеры для каждой задачи
- Ротация логов по размеру

### Метрики
- Время обработки каждого сайта
- Количество найденных email'ов и форм
- Статистика успешных/неудачных запросов

### Health Check
```bash
curl http://localhost:8000/
```

## 🔒 Безопасность

- Rate limiting для предотвращения злоупотреблений
- Валидация всех входящих данных через Pydantic
- Безопасное хранение API ключей в переменных окружения
- CORS политики для frontend

## 🚀 Производительность

### Оптимизации
- Пулы соединений для HTTP запросов
- Retry стратегии для надежности
- Batch обработка для ускорения
- Умное кэширование результатов

### Масштабирование
- Асинхронная обработка задач
- Готовность к горизонтальному масштабированию
- Поддержка нескольких воркеров

## 🛠️ Разработка

### Структура кода
- Разделение на модули по функциональности
- Dependency Injection через FastAPI
- Типизация с помощью Pydantic и typing

### Код стайл
- PEP 8 соблюдение
- Type hints для всех функций
- Docstrings для публичных методов

### Debugging
```bash
# Режим отладки
DEBUG_MODE=true python main.py

# Подробные логи
LOG_LEVEL=DEBUG python main.py
``` 