// Cloudflare Worker для генерации OG изображений в PNG формате
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Получаем параметры из URL
    const title = url.searchParams.get('title') || 'Анализ криптоновостей';
    const reportId = url.searchParams.get('id') || 'report';
    const description = url.searchParams.get('description') || 'Профессиональный анализ криптовалют';
    
    // Проверяем кэш
    const cachedResponse = await caches.default.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Генерируем PNG изображение
    const imageBuffer = await generatePNG(title, reportId, description);
    
    // Создаем response
    const response = new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // 24 часа кэш
      },
    });
    
    // Кэшируем response
    ctx.waitUntil(caches.default.put(request, response.clone()));
    
    return response;
  },
};

async function generatePNG(title, reportId, description) {
  // Обрезаем длинные строки
  const maxTitleLength = 35;
  const maxDescLength = 60;
  const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
  const displayDesc = description.length > maxDescLength ? description.substring(0, maxDescLength) + '...' : description;
  
  // Используем внешний сервис для генерации изображения
  // Поскольку Canvas недоступен в Cloudflare Workers
  
  // Создаем URL с параметрами для внешнего сервиса генерации изображений
  const imageUrl = `https://image-charts.com/chart?` +
    `chs=1200x630` +
    `&chco=1e293b,3b82f6,10b981,f59e0b` +
    `&chd=t:50,30,20` +
    `&cht=p3` +
    `&chl=${encodeURIComponent('📊 ' + displayTitle)}|${encodeURIComponent('ID: ' + reportId)}|${encodeURIComponent(displayDesc)}` +
    `&chtt=${encodeURIComponent('News Analysis')}` +
    `&chts=ffffff,24` +
    `&chf=bg,s,0f172a`;
  
  try {
    // Получаем изображение от внешнего сервиса
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const imageBuffer = await response.arrayBuffer();
    return new Uint8Array(imageBuffer);
  } catch (error) {
    // Fallback: создаем простое текстовое изображение
    return generateSimpleImage(displayTitle, reportId, displayDesc);
  }
}

// Простой fallback без Canvas
async function generateSimpleImage(title, reportId, description) {
  // Создаем базовый SVG и конвертируем в PNG через внешний сервис
  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="50" y="50" width="1100" height="530" rx="20" fill="rgba(30,41,59,0.9)" stroke="#3b82f6" stroke-width="3"/>
  
  <text x="100" y="150" font-family="Arial" font-size="48" font-weight="bold" fill="#3b82f6">📊 News Analysis</text>
  <text x="100" y="220" font-family="Arial" font-size="36" font-weight="bold" fill="#ffffff">${escapeXml(title)}</text>
  <text x="100" y="280" font-family="Arial" font-size="24" fill="#3b82f6">ID: ${escapeXml(reportId)}</text>
  <text x="100" y="340" font-family="Arial" font-size="20" fill="#cbd5e1">${escapeXml(description)}</text>
  
  <rect x="100" y="400" width="300" height="80" rx="10" fill="rgba(16,185,129,0.2)" stroke="#10b981"/>
  <text x="250" y="430" font-family="Arial" font-size="16" fill="#10b981" text-anchor="middle">📈 РОСТ</text>
  <text x="250" y="455" font-family="Arial" font-size="28" font-weight="bold" fill="#10b981" text-anchor="middle">+15.7%</text>
  
  <rect x="450" y="400" width="300" height="80" rx="10" fill="rgba(59,130,246,0.2)" stroke="#3b82f6"/>
  <text x="600" y="430" font-family="Arial" font-size="16" fill="#3b82f6" text-anchor="middle">📊 ОТЧЕТЫ</text>
  <text x="600" y="455" font-family="Arial" font-size="28" font-weight="bold" fill="#3b82f6" text-anchor="middle">247</text>
  
  <rect x="800" y="400" width="300" height="80" rx="10" fill="rgba(245,158,11,0.2)" stroke="#f59e0b"/>
  <text x="950" y="430" font-family="Arial" font-size="16" fill="#f59e0b" text-anchor="middle">🎯 ТОЧНОСТЬ</text>
  <text x="950" y="455" font-family="Arial" font-size="28" font-weight="bold" fill="#f59e0b" text-anchor="middle">87%</text>
  
  <text x="100" y="550" font-family="Arial" font-size="16" fill="#64748b">anykeyer.github.io/NewsStat</text>
  <text x="1100" y="550" font-family="Arial" font-size="16" fill="#64748b" text-anchor="end">Криптоаналитика</text>
</svg>`;

  // Конвертируем SVG в PNG через простой API сервис
  try {
    const response = await fetch('https://api.htmlcsstoimage.com/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('demo:demo') // demo credentials
      },
      body: JSON.stringify({
        html: `<div style="width: 1200px; height: 630px;">${svg}</div>`,
        css: '',
        width: 1200,
        height: 630,
        format: 'png'
      })
    });
    
    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();
      return new Uint8Array(imageBuffer);
    }
  } catch (e) {
    // Если все API недоступны, возвращаем простую замену
  }
  
  // Последний fallback - используем placeholder.com
  const fallbackUrl = `https://via.placeholder.com/1200x630/1e293b/3b82f6?text=${encodeURIComponent(title + ' | ID: ' + reportId)}`;
  const fallbackResponse = await fetch(fallbackUrl);
  const fallbackBuffer = await fallbackResponse.arrayBuffer();
  return new Uint8Array(fallbackBuffer);
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

