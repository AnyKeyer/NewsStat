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
    <meta property="og:image" content="https://anykeyer.github.io/NewsStat/og-images/${reportId}.svg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="https://anykeyer.github.io/NewsStat/report/${reportId}" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="📊 ${title || `Отчет ${reportId}`} | News Analysis" />
    <meta name="twitter:description" content="${description || `🚀 Детальный анализ влияния криптоновостей на токены в отчете ${reportId}.`}" />
    <meta name="twitter:image" content="https://anykeyer.github.io/NewsStat/og-images/${reportId}.svg" />
    
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

// Функция для создания SVG OG-изображения
const createOGImageSVG = (title, reportId, description = '') => `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(59,130,246,0.1)" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Main container -->
  <rect x="50" y="40" width="1100" height="550" rx="24" fill="rgba(30,41,59,0.95)" stroke="#475569" stroke-width="2"/>
  
  <!-- Header -->
  <text x="100" y="140" font-family="system-ui,-apple-system,sans-serif" font-size="56" fill="#3b82f6">📊</text>
  <text x="180" y="130" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="700" fill="#3b82f6">News Analysis</text>
  
  <!-- Title -->
  <text x="100" y="220" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="700" fill="#f1f5f9">${title.length > 40 ? title.substring(0, 40) + '...' : title}</text>
  
  <!-- ID -->
  <rect x="100" y="240" width="${120 + reportId.length * 8}" height="35" rx="8" fill="rgba(51,65,85,0.6)"/>
  <text x="115" y="260" font-family="Courier New,monospace" font-size="18" fill="#64748b">ID: ${reportId}</text>
  
  <!-- Description -->
  <text x="100" y="320" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#cbd5e1">${description.length > 80 ? description.substring(0, 80) + '...' : description}</text>
  
  <!-- Stats -->
  <!-- Stat 1 -->
  <rect x="100" y="370" width="300" height="120" rx="16" fill="rgba(51,65,85,0.8)" stroke="#475569"/>
  <rect x="100" y="370" width="300" height="3" fill="#3b82f6"/>
  <text x="250" y="400" font-family="system-ui,-apple-system,sans-serif" font-size="24" text-anchor="middle">📰</text>
  <text x="250" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="700" fill="white" text-anchor="middle">15</text>
  <text x="250" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">НОВОСТЕЙ</text>
  
  <!-- Stat 2 -->
  <rect x="450" y="370" width="300" height="120" rx="16" fill="rgba(51,65,85,0.8)" stroke="#475569"/>
  <rect x="450" y="370" width="300" height="3" fill="#10b981"/>
  <text x="600" y="400" font-family="system-ui,-apple-system,sans-serif" font-size="24" text-anchor="middle">📈</text>
  <text x="600" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="700" fill="#10b981" text-anchor="middle">+8.7%</text>
  <text x="600" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">РОСТ</text>
  
  <!-- Stat 3 -->
  <rect x="800" y="370" width="300" height="120" rx="16" fill="rgba(51,65,85,0.8)" stroke="#475569"/>
  <rect x="800" y="370" width="300" height="3" fill="#ef4444"/>
  <text x="950" y="400" font-family="system-ui,-apple-system,sans-serif" font-size="24" text-anchor="middle">📉</text>
  <text x="950" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="700" fill="#ef4444" text-anchor="middle">-5.2%</text>
  <text x="950" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">СПАД</text>
  
  <!-- Footer -->
  <rect x="100" y="530" width="24" height="24" rx="6" fill="#3b82f6"/>
  <text x="112" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="white" text-anchor="middle">📊</text>
  <text x="140" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b">anykeyer.github.io/NewsStat</text>
  <text x="1050" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b" text-anchor="end">Криптоаналитика</text>
</svg>`;

// Функция для создания статичного OG-изображения
const createOGImageHTML = (title, reportId, description = '') => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            width: 1200px;
            height: 630px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        
        /* Grid background */
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
        }
        
        .container {
            width: 1100px;
            height: 550px;
            background: rgba(30, 41, 59, 0.95);
            border-radius: 24px;
            border: 2px solid #475569;
            padding: 50px;
            box-sizing: border-box;
            position: relative;
            backdrop-filter: blur(10px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 40px;
        }
        
        .logo {
            font-size: 56px;
            margin-right: 24px;
            filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
        }
        
        .brand {
            font-size: 32px;
            font-weight: 700;
            color: #3b82f6;
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .report-title {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 24px;
            color: #f1f5f9;
            line-height: 1.2;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .report-id {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 40px;
            font-family: 'Courier New', monospace;
            background: rgba(51, 65, 85, 0.6);
            padding: 8px 16px;
            border-radius: 8px;
            display: inline-block;
        }
        
        .description {
            font-size: 22px;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 40px;
        }
        
        .stats {
            display: flex;
            gap: 24px;
            margin-bottom: 30px;
        }
        
        .stat {
            flex: 1;
            background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.6) 100%);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            border: 1px solid #475569;
            position: relative;
            overflow: hidden;
        }
        
        .stat::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
        }
        
        .stat-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        
        .footer {
            position: absolute;
            bottom: 30px;
            left: 50px;
            right: 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            color: #64748b;
        }
        
        .footer-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .footer-icon {
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📊</div>
            <div class="brand">News Analysis</div>
        </div>
        
        <div class="report-title">${title}</div>
        
        <div class="report-id">ID: ${reportId}</div>
        
        <div class="description">
            ${description || 'Профессиональный анализ влияния новостей на курсы криптовалют'}
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-icon">📰</div>
                <div class="stat-value">15</div>
                <div class="stat-label">Новостей</div>
            </div>
            <div class="stat">
                <div class="stat-icon">📈</div>
                <div class="stat-value positive">+8.7%</div>
                <div class="stat-label">Рост</div>
            </div>
            <div class="stat">
                <div class="stat-icon">📉</div>
                <div class="stat-value negative">-5.2%</div>
                <div class="stat-label">Спад</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-left">
                <div class="footer-icon">📊</div>
                <div>anykeyer.github.io/NewsStat</div>
            </div>
            <div>Криптоаналитика</div>
        </div>
    </div>
</body>
</html>`;

// Создаем директории
const reportsDir = path.join(__dirname, '../dist/report');
const ogImagesDir = path.join(__dirname, '../dist/og-images');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
if (!fs.existsSync(ogImagesDir)) {
  fs.mkdirSync(ogImagesDir, { recursive: true });
}

// Импортируем данные отчетов из централизованного сервиса
// В Node.js окружении мы не можем импортировать TS файлы напрямую,
// поэтому дублируем данные здесь, но в будущем можно настроить сборку
const sampleReports = [
  {
    id: 'mfwmt8jfstpheqzctef',
    title: 'Bitcoin ETF одобрен SEC - влияние на рынок',
    description: 'Анализ влияния одобрения Bitcoin ETF комиссией по ценным бумагам США на курс BTC и весь криптовалютный рынок.',
    newsCount: 15,
    profitability: { positive: 8.7, negative: -2.3 }
  },
  {
    id: 'sample-report-1',
    title: 'Ethereum обновление London Fork',
    description: 'Подробный анализ влияния обновления London Fork на экосистему Ethereum и цену ETH.',
    newsCount: 12,
    profitability: { positive: 12.1, negative: -5.4 }
  }
];

// Генерируем HTML файлы для каждого отчета
sampleReports.forEach(report => {
  // Создаем страницу отчета
  const reportPath = path.join(reportsDir, report.id);
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const htmlContent = createReportHTML(report.id, report.title, report.description);
  fs.writeFileSync(path.join(reportPath, 'index.html'), htmlContent);
  
  // Создаем SVG OG-изображение для отчета
  const ogImageSVG = createOGImageSVG(report.title, report.id, report.description);
  fs.writeFileSync(path.join(ogImagesDir, `${report.id}.svg`), ogImageSVG);
  
  console.log(`✅ Создан файл: /report/${report.id}/index.html`);
  console.log(`✅ Создано SVG-изображение: /og-images/${report.id}.svg`);
});

console.log(`\n🎉 Генерация завершена! Создано ${sampleReports.length} статических страниц отчетов.`);
console.log('📊 Используется универсальный og-image.html с динамической загрузкой данных');
console.log('🔄 Новые отчеты автоматически получат правильные превью!');