// СУПЕР НАДЕЖНЫЙ Cloudflare Worker для OG изображений
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
    
    // Генерируем изображение через внешние API
    const imageBuffer = await generateStaticPNG(title, reportId, description);
    
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

// НАДЕЖНОЕ решение - используем внешний API для PNG
async function generateStaticPNG(title, reportId, description) {
  // Обрезаем строки для корректного отображения
  const maxTitleLength = 25;
  const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
  
  // Простой текст для изображения
  const text = `${displayTitle} (ID: ${reportId})`;
  
  // Надежные сервисы для генерации PNG
  const services = [
    `https://fakeimg.pl/1200x630/1e293b/3b82f6/?text=${encodeURIComponent(text)}&font=bebas`,
    `https://dummyimage.com/1200x630/1e293b/3b82f6.png&text=${encodeURIComponent(text)}`,
    `https://via.placeholder.com/1200x630/1e293b/3b82f6.png?text=${encodeURIComponent(text)}`
  ];
  
  // Пробуем сервисы по очереди
  for (const serviceUrl of services) {
    try {
      const response = await fetch(serviceUrl);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        return new Uint8Array(imageBuffer);
      }
    } catch (error) {
      console.log(`Service failed: ${serviceUrl}`);
      continue;
    }
  }
  
  // Последний fallback - минимальное PNG
  return createMinimalPNG();
}

// Создает минимальное PNG изображение синего цвета 1200x630
function createMinimalPNG() {
  // Простое синее PNG изображение в base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAABLAAAAJ2CAYAAABM8tqUAAAACXBIWXMAAAsTAAALEwEAmpwYAAABnElEQVR4nO3BMQEAAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+BoGRAABKI4lrQAAAABJRU5ErkJggg==';
  
  const binaryString = atob(pngBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}





