// Утилита для отладки localStorage в mock режиме
export function debugLocalStorage() {
  console.log('=== DEBUG localStorage ===')
  console.log('Users:', localStorage.getItem('news-analysis-users'))
  console.log('Reports:', localStorage.getItem('news-analysis-reports'))
  console.log('========================')
}

export function clearAllData() {
  localStorage.removeItem('news-analysis-users')
  localStorage.removeItem('news-analysis-reports')
  localStorage.removeItem('news-analysis-user')
  console.log('Все данные очищены')
}