# 🚀 Настройка Cloudflare Worker для OG-превью

## Что делать:

### 1. Создать Worker
- Идите на https://dash.cloudflare.com
- Workers & Pages → Create application → Create Worker
- Имя: `newsstat-og-generator`

### 2. Скопировать код
- Откройте `cloudflare-worker-og.js`
- Скопируйте ВЕСЬ код
- Вставьте в Cloudflare редактор
- Save and Deploy

### 3. Получить URL Worker'а
После деплоя скопируйте URL (например: `https://newsstat-og-generator.username.workers.dev`)

### 4. Обновить код проекта
В файле `scripts/generate-reports.js` замените:
```
YOUR_USERNAME
```
На ваш реальный Cloudflare username/subdomain

### 5. Пересобрать проект
```bash
npm run build
npm run generate-reports
```

### 6. Закоммитить и запушить
```bash
git add .
git commit -m "Add Cloudflare Worker for dynamic OG previews"
git push
```

## ✅ Готово!
Теперь каждый отчет будет иметь уникальное превью изображение!

## 🧪 Тестирование
Проверить можно по URL:
`https://newsstat-og-generator.YOUR_USERNAME.workers.dev/?title=Тест&id=123&description=Описание`