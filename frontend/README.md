# Frontend - Website Contact Parser UI

Современное React приложение для управления парсингом контактной информации с веб-сайтов.

## 🏗️ Архитектура

```
frontend/
├── public/             # Статические файлы
├── src/
│   ├── components/     # React компоненты
│   │   ├── Header.tsx           # Заголовок приложения
│   │   ├── ParsingControls.tsx  # Форма управления парсингом
│   │   ├── TaskList.tsx         # Список задач
│   │   ├── TaskDetailsModal.tsx # Модальное окно с деталями
│   │   ├── QuickStats.tsx       # Быстрая статистика
│   │   └── SimpleNotifications.tsx # Система уведомлений
│   ├── hooks/          # Custom React хуки
│   ├── services/       # API сервисы
│   ├── utils/          # Утилиты
│   ├── types/          # TypeScript типы
│   ├── App.tsx         # Главный компонент
│   └── main.tsx        # Точка входа
├── index.html          # HTML шаблон
├── package.json        # NPM зависимости
├── vite.config.ts      # Конфигурация Vite
├── tailwind.config.js  # Настройки Tailwind CSS
├── Dockerfile          # Docker образ
└── nginx.conf          # Nginx конфигурация
```

## 🎨 Технологический стек

- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Быстрый сборщик
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Иконки
- **date-fns** - Работа с датами

## 🚀 Установка и запуск

### Docker (рекомендуется)

```bash
# Из корневой директории проекта
docker-compose up frontend
```

### Локальная разработка

1. **Установка зависимостей:**
```bash
cd frontend
npm install
```

2. **Настройка переменных окружения:**
```bash
# Создайте .env файл
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

3. **Запуск dev сервера:**
```bash
npm run dev
```

4. **Откройте в браузере:**
```
http://localhost:5173
```

## 📦 NPM команды

```bash
npm run dev        # Запуск dev сервера
npm run build      # Сборка для продакшена
npm run preview    # Предварительный просмотр сборки
npm run lint       # Проверка кода ESLint
```

## 🧩 Компоненты

### App.tsx
Главный компонент приложения, управляет состоянием и координирует работу всех компонентов.

**Основные возможности:**
- Управление состоянием задач
- Обработка парсинга сайтов
- Система уведомлений
- Модальные окна

### ParsingControls.tsx
Панель управления парсингом с двумя вкладками:

**Одиночный парсинг:**
- Ввод URL сайта
- Настройки (sitemap, AI валидация)
- Кнопка запуска

**Батч-парсинг:**
- Поисковый запрос
- Количество результатов
- Настройки обработки

```tsx
interface SingleSiteRequest {
  url: string;
  skip_sitemap: boolean;
  use_ai_validation: boolean;
}

interface BatchRequest {
  query: string;
  num_results: number;
  skip_sitemap: boolean;
  use_ai_validation: boolean;
}
```

### TaskList.tsx
Список всех задач парсинга с фильтрацией и управлением.

**Возможности:**
- Фильтрация по статусу (все, активные, завершенные, ошибки)
- Отображение прогресса
- Удаление задач
- Экспорт результатов
- Детальный просмотр

### TaskDetailsModal.tsx
Модальное окно с подробной информацией о задаче.

**Содержимое:**
- Параметры задачи
- Список обработанных сайтов
- Найденные email адреса
- Контактные формы
- Статистика обработки
- Экспорт в CSV

### QuickStats.tsx
Панель быстрой статистики с ключевыми метриками.

**Показатели:**
- Общее количество задач
- Активные задачи
- Найденные email'ы
- Обработанные сайты

### SimpleNotifications.tsx
Система уведомлений для пользователя.

**Типы уведомлений:**
- Успешные операции (зеленые)
- Ошибки (красные)
- Автоматическое скрытие через 5 сек

## 🔧 Custom хуки

### useTasks
Управление состоянием задач и API вызовами.

```tsx
const {
  tasks,
  isLoading,
  selectedTask,
  taskSites,
  loadTasks,
  handleTaskClick,
  handleTaskDelete
} = useTasks();
```

### useParsing
Обработка запросов парсинга.

```tsx
const {
  isLoading,
  parseSingleSite,
  parseBatchSites
} = useParsing();
```

### useNotifications
Система уведомлений.

```tsx
const {
  notifications,
  showSuccess,
  showError,
  removeNotification
} = useNotifications();
```

## 🎨 Дизайн система

### Цветовая палитра
- **Фон:** Градиент от slate-900 до blue-900
- **Карточки:** slate-800 с прозрачностью
- **Акцент:** blue-500, green-500, red-500
- **Текст:** white, slate-300, slate-400

### Компоненты UI
- **Кнопки:** Rounded, с hover эффектами
- **Формы:** Темные инпуты с focus состояниями
- **Модалы:** Backdrop blur с анимациями
- **Уведомления:** Slide-in анимации

### Адаптивность
- **Desktop first** подход
- **Grid layouts** для адаптации
- **Responsive breakpoints:** sm, md, lg, xl

## 📱 Пользовательский интерфейс

### Главная страница
```
┌─────────────────────────────────────────────────────┐
│ Header                                              │
├─────────────────┬───────────────────────────────────┤
│ Parsing Controls│ Task List                         │
│                 │ ┌─────────────────────────────────┤
│ Quick Stats     │ │ Filters                         │
│                 │ ├─────────────────────────────────┤
│                 │ │ Task 1 [Running]               │
│                 │ │ Task 2 [Completed] [Export]    │
│                 │ │ Task 3 [Failed]                │
└─────────────────┴─────────────────────────────────────┘
```

### Формы парсинга
- **Валидация в реальном времени**
- **Индикаторы загрузки**
- **Подсказки для пользователя**
- **Сохранение состояния форм**

### Список задач
- **Цветовое кодирование статусов**
- **Прогресс бары для активных задач**
- **Быстрые действия (экспорт, удаление)**
- **Сортировка по дате создания**

## 🔄 Управление состоянием

### Локальное состояние
Используется встроенный `useState` для:
- Формы ввода
- UI состояния (модалы, фильтры)
- Временные данные

### Серверное состояние
Периодическое обновление данных с сервера:
- Список задач каждые 5 секунд
- Детали задачи при открытии модала
- Статистика в реальном времени

## 🌐 API интеграция

### Сервисы
```typescript
// services/api.ts
export const apiService = {
  parseSingleSite: (data: SingleSiteRequest) => Promise<ApiResponse>,
  parseBatchSites: (data: BatchRequest) => Promise<ApiResponse>,
  getTasks: () => Promise<Task[]>,
  getTaskDetails: (id: string) => Promise<TaskDetails>,
  deleteTask: (id: string) => Promise<void>,
  exportCsv: (id: string) => Promise<Blob>
};
```

### Обработка ошибок
- **Centralized error handling**
- **User-friendly error messages**
- **Retry механизмы**
- **Offline detection**

## 📊 Производительность

### Оптимизации
- **Code splitting** по роутам
- **Lazy loading** компонентов
- **Memoization** тяжелых вычислений
- **Debouncing** пользовательского ввода

### Bundle анализ
```bash
npm run build && npx vite-bundle-analyzer dist
```

## 🧪 Тестирование

### Настройка тестов
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Запуск тестов
```bash
npm run test
npm run test:coverage
```

## 🔧 Конфигурация

### Vite (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### Tailwind (tailwind.config.js)
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom colors
      }
    }
  }
};
```

## 🚀 Деплой

### Docker Production
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Статический хостинг
```bash
npm run build
# Загрузите dist/ на хостинг
```

## 🛠️ Разработка

### Код стайл
- **ESLint** для проверки кода
- **Prettier** для форматирования
- **TypeScript strict mode**
- **Absolute imports** для чистоты

### Debugging
- **React DevTools**
- **Redux DevTools** (если используется)
- **Console logging** с уровнями
- **Error boundaries** для отлова ошибок 