#!/usr/bin/env node

// Скрипт для создания УНИВЕРСАЛЬНОГО обработчика отчетов
// Работает с ЛЮБЫМИ report ID из R2 базы данных динамически
// Никаких статических файлов - только один универсальный index.html

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Создаем универсальный обработчик отчетов для R2 базы данных...\n');

// Создаем директорию для отчетов
const reportsDir = path.join(__dirname, '../dist/report');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Универсальный HTML обработчик для ЛЮБЫХ report ID
const universalReportHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Dynamic meta tags for ANY report from R2 database -->
    <title id="page-title">📊 Анализ криптоновостей | News Analysis</title>
    <meta id="page-description" name="description" content="Профессиональный анализ влияния криптоновостей на рынок токенов из R2 базы данных." />
    
    <!-- Open Graph мета-теги -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="News Analysis" />
    <meta property="og:title" id="og-title" content="📊 Анализ криптоновостей | News Analysis" />
    <meta property="og:description" id="og-description" content="Профессиональный анализ влияния криптоновостей на рынок токенов." />
    <meta property="og:image" id="og-image" content="https://newsstat-og-generator.slejv710.workers.dev/?title=Анализ%20криптоновостей&id=report&description=Профессиональный%20анализ%20влияния%20криптоновостей%20на%20рынок" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" id="og-url" content="https://anykeyer.github.io/NewsStat/" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" id="twitter-title" content="📊 Анализ криптоновостей | News Analysis" />
    <meta name="twitter:description" id="twitter-description" content="Профессиональный анализ влияния криптоновостей на рынок токенов." />
    <meta name="twitter:image" id="twitter-image" content="https://newsstat-og-generator.slejv710.workers.dev/?title=Анализ%20криптоновостей&id=report&description=Профессиональный%20анализ%20влияния%20криптоновостей%20на%20рынок" />
    
    <script>
      // 🎯 УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК для R2 BASE ДАННЫХ
      console.log('🔍 Universal R2 Report Handler v3.0 activated');
      
      // Получаем report ID из URL
      var fullPath = window.location.pathname;
      var reportId = null;
      
      // Поддерживаем все варианты URL:
      // /NewsStat/report/mfwxdklij34p858ql4t
      // /report/mfwxdklij34p858ql4t  
      var reportMatch = fullPath.match(/\\/report\\/([a-zA-Z0-9]+)/);
      if (reportMatch) {
        reportId = reportMatch[1];
      }
      
      console.log('📊 Report ID from R2:', reportId);
      console.log('🌐 Full Path:', fullPath);
      
      if (reportId && reportId.length > 5) {
        // Обновляем мета-теги для конкретного отчета из R2
        var title = '📊 Отчет ' + reportId + ' | News Analysis';
        var description = 'Детальный анализ криптоновостей из R2 базы данных. Отчет ' + reportId + ' - статистика влияния новостей на курсы токенов с процентными показателями роста и падения.';
        var imageUrl = 'https://newsstat-og-generator.slejv710.workers.dev/?title=' + encodeURIComponent('Отчет ' + reportId) + '&id=' + encodeURIComponent(reportId) + '&description=' + encodeURIComponent('Анализ из R2: ' + reportId);
        var pageUrl = 'https://anykeyer.github.io/NewsStat/report/' + reportId;
        
        console.log('🎯 Updating meta tags for R2 report:', reportId);
        console.log('🖼️ Generated Image URL:', imageUrl);
        
        // Динамически обновляем все мета-теги
        document.getElementById('page-title').textContent = title;
        document.getElementById('page-description').content = description;
        document.getElementById('og-title').content = title;
        document.getElementById('og-description').content = description;
        document.getElementById('og-image').content = imageUrl;
        document.getElementById('og-url').content = pageUrl;
        document.getElementById('twitter-title').content = title;
        document.getElementById('twitter-description').content = description;
        document.getElementById('twitter-image').content = imageUrl;
        document.title = title;
        
        console.log('✅ Meta tags updated for R2 report:', reportId);
      } else {
        console.log('⚠️ No valid report ID found');
      }
      
      // Детекция ботов для социальных сетей  
      var userAgent = navigator.userAgent || '';
      var isBot = /bot|crawler|spider|crawling|telegram|whatsapp|facebook|twitter|slack|discord/i.test(userAgent);
      
      console.log('🤖 User Agent:', userAgent);
      console.log('🔍 Is Social Media Bot:', isBot);
      
      if (!isBot) {
        console.log('👤 Human user detected - redirecting to Vue SPA');
        // Для пользователей - редирект в Vue SPA
        if (reportId) {
          sessionStorage.setItem('redirectPath', '/report/' + reportId);
        }
        // Задержка для загрузки мета-тегов перед редиректом
        setTimeout(function() {
          window.location.href = '/NewsStat/';
        }, 200);
      } else {
        console.log('🤖 Social media bot detected - displaying meta tags');
        // Для ботов социальных сетей - остаемся на странице с мета-тегами
      }
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
      .loader { font-size: 48px; margin-bottom: 20px; }
      .title { font-size: 24px; margin-bottom: 10px; color: #3b82f6; }
      .description { font-size: 16px; color: #cbd5e1; margin-bottom: 20px; }
      .tech-info { font-size: 12px; color: #64748b; margin-top: 20px; }
      .link {
        color: #3b82f6;
        text-decoration: none;
        font-size: 18px;
        padding: 10px 20px;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        display: inline-block;
        transition: all 0.2s ease;
        margin-top: 20px;
      }
      .link:hover { background: #3b82f6; color: white; }
    </style>
</head>
<body>
    <div class="loader">📊</div>
    <div class="title">Загружаем отчет из R2...</div>
    <div class="description">Анализ криптоновостей</div>
    <div class="tech-info">Universal R2 Handler v3.0 | Dynamic Report Processing</div>
    
    <!-- Для ботов без JavaScript -->
    <noscript>
      <div>
        <a href="/NewsStat/" class="link">📊 Перейти к анализу</a>
      </div>
    </noscript>
</body>
</html>`;

// Удаляем все старые статические отчеты
console.log('🗑️ Удаляем старые статические отчеты...');
const existingDirs = fs.readdirSync(reportsDir, { withFileTypes: true });
existingDirs.forEach(dirent => {
  if (dirent.isDirectory()) {
    const dirPath = path.join(reportsDir, dirent.name);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log('❌ Удален статический отчет:', dirent.name);
  }
});

// Создаем ЕДИНСТВЕННЫЙ универсальный index.html
fs.writeFileSync(path.join(reportsDir, 'index.html'), universalReportHTML);

console.log('\\n🎉 Универсальный обработчик создан!');
console.log('✅ Теперь ВСЕ report ID обрабатываются динамически');
console.log('🗄️ Работает с R2 базой данных без статической генерации');
console.log('🔗 URL: /report/ЛЮБОЙ_ID_ИЗ_R2');
console.log('\\n🚀 Готово для работы с Telegram и другими социальными сетями!');