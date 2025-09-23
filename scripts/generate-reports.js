#!/usr/bin/env node

// Скрипт для генерации статических страниц отчетов с правильными мета-тегами
// Запускается после build для создания SEO-friendly страниц

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шаблон HTML для отчета
const createReportHTML = (reportId, title = '', description = '') => `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/NewsStat/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Dynamic meta tags for report -->
    <title>📊 ${title || `Отчет ${reportId}`} | News Analysis</title>
    <meta name="description" content="${description || `Детальный анализ криптоновостей в отчете ${reportId}. Статистика влияния новостей на курсы токенов с процентными показателями роста и падения.`}" />
    
    <!-- Open Graph мета-теги -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="News Analysis" />
    <meta property="og:title" content="📊 ${title || `Отчет ${reportId}`} | News Analysis" />
    <meta property="og:description" content="${description || `🚀 Детальный анализ влияния криптоновостей на токены. Профессиональная статистика роста и падения на основе медийных событий в отчете ${reportId}.`}" />
    <meta property="og:image" content="https://anykeyer.github.io/NewsStat/og-image.html?title=${encodeURIComponent(title || `Отчет ${reportId}`)}&id=${reportId}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://anykeyer.github.io/NewsStat/report/${reportId}" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="📊 ${title || `Отчет ${reportId}`} | News Analysis" />
    <meta name="twitter:description" content="${description || `🚀 Детальный анализ влияния криптоновостей на токены в отчете ${reportId}.`}" />
    <meta name="twitter:image" content="https://anykeyer.github.io/NewsStat/og-image.html?title=${encodeURIComponent(title || `Отчет ${reportId}`)}&id=${reportId}" />
    
    <!-- Redirect script for SPA -->
    <script>
      // Сохраняем текущий путь и перенаправляем на SPA
      sessionStorage.setItem('redirectPath', '/report/${reportId}');
      window.location.href = '/NewsStat/';
    </script>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        margin: 0;
        padding: 50px 20px;
        text-align: center;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .loader {
        font-size: 48px;
        margin-bottom: 20px;
      }
      .title {
        font-size: 24px;
        margin-bottom: 10px;
        color: #3b82f6;
      }
      .description {
        font-size: 16px;
        color: #cbd5e1;
        margin-bottom: 30px;
      }
      .link {
        color: #3b82f6;
        text-decoration: none;
        font-size: 18px;
        padding: 10px 20px;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        display: inline-block;
        transition: all 0.2s ease;
      }
      .link:hover {
        background: #3b82f6;
        color: white;
      }
    </style>
</head>
<body>
    <div class="loader">📊</div>
    <div class="title">${title || `Отчет ${reportId}`}</div>
    <div class="description">Загружаем анализ криптоновостей...</div>
    <noscript>
      <a href="/NewsStat/" class="link">Перейти на главную</a>
    </noscript>
</body>
</html>`;

// Создаем директорию для отчетов
const reportsDir = path.join(__dirname, '../dist/report');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Примеры отчетов (в реальности можно брать из API или базы данных)
const sampleReports = [
  {
    id: 'mfwmt8jfstpheqzctef', 
    title: 'Анализ BTC после новостей Tesla',
    description: 'Подробный анализ влияния новостей Tesla на курс Bitcoin с детальной статистикой роста.'
  },
  {
    id: 'sample-report-1',
    title: 'ETH реакция на обновление Ethereum',
    description: 'Исследование влияния технических новостей Ethereum на динамику курса ETH.'
  }
];

// Генерируем HTML файлы для каждого отчета
sampleReports.forEach(report => {
  const reportPath = path.join(reportsDir, report.id);
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const htmlContent = createReportHTML(report.id, report.title, report.description);
  fs.writeFileSync(path.join(reportPath, 'index.html'), htmlContent);
  
  console.log(`✅ Создан файл: /report/${report.id}/index.html`);
});

console.log(`\n🎉 Генерация завершена! Создано ${sampleReports.length} статических страниц отчетов.`);
console.log('Теперь URL вида https://anykeyer.github.io/NewsStat/report/ID будут иметь правильные мета-теги!');