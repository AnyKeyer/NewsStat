// Cloudflare Worker для генерации OG изображений
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
    
    // Создаем ключ для кэширования
    const cacheKey = `og-${reportId}-${encodeURIComponent(title)}`;
    
    // Проверяем кэш
    const cachedResponse = await caches.default.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Генерируем SVG (быстрее чем Canvas для простых изображений)
    const svg = generateSVG(title, reportId, description);
    
    // Создаем response
    const response = new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // 24 часа кэш
      },
    });
    
    // Кэшируем response
    ctx.waitUntil(caches.default.put(request, response.clone()));
    
    return response;
  },
};

function generateSVG(title, reportId, description) {
  // Обрезаем длинные строки
  const maxTitleLength = 45;
  const maxDescLength = 80;
  const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
  const displayDesc = description.length > maxDescLength ? description.substring(0, maxDescLength) + '...' : description;
  
  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
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
  <text x="100" y="220" font-family="system-ui,-apple-system,sans-serif" font-size="42" font-weight="700" fill="#f1f5f9">${escapeHtml(displayTitle)}</text>
  
  <!-- ID Badge -->
  <rect x="100" y="250" width="${Math.max(120, 80 + reportId.length * 12)}" height="30" rx="15" fill="rgba(59,130,246,0.2)" stroke="#3b82f6"/>
  <text x="${100 + Math.max(60, 40 + reportId.length * 6)}" y="270" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#3b82f6" text-anchor="middle" font-weight="600">ID: ${escapeHtml(reportId)}</text>
  
  <!-- Description -->
  <text x="100" y="320" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#cbd5e1">${escapeHtml(displayDesc)}</text>
  
  <!-- Stats Container -->
  <rect x="100" y="370" width="1000" height="120" rx="16" fill="rgba(51,65,85,0.6)" stroke="#475569"/>
  
  <!-- Stat 1 -->
  <text x="200" y="405" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">📈 АНАЛИТИКА</text>
  <text x="200" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="700" fill="#10b981" text-anchor="middle">+15.7%</text>
  <text x="200" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">СРЕДНИЙ РОСТ</text>
  
  <!-- Stat 2 -->
  <text x="600" y="405" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">📊 ОТЧЕТЫ</text>
  <text x="600" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="700" fill="#3b82f6" text-anchor="middle">247</text>
  <text x="600" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">ВСЕГО СОЗДАНО</text>
  
  <!-- Stat 3 -->
  <text x="1000" y="405" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">🎯 ТОЧНОСТЬ</text>
  <text x="1000" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="32" font-weight="700" fill="#f59e0b" text-anchor="middle">87%</text>
  <text x="1000" y="465" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">ПРОГНОЗОВ</text>
  
  <!-- Footer -->
  <rect x="100" y="530" width="24" height="24" rx="6" fill="#3b82f6"/>
  <text x="112" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="white" text-anchor="middle">📊</text>
  <text x="140" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b">anykeyer.github.io/NewsStat</text>
  <text x="1050" y="547" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b" text-anchor="end">Криптоаналитика</text>
</svg>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}