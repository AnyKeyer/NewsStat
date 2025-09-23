// Сервис для работы с отчетами - централизованное место для всех операций с данными

export interface ReportData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  author: string;
  newsCount: number;
  profitability: {
    positive: number;
    negative: number;
  };
}

// Централизованные моковые данные - в будущем заменятся на API
const MOCK_REPORTS: Record<string, ReportData> = {
  'mfwmt8jfstpheqzctef': {
    id: 'mfwmt8jfstpheqzctef',
    title: 'Bitcoin ETF одобрен SEC - влияние на рынок',
    description: 'Анализ влияния одобрения Bitcoin ETF комиссией по ценным бумагам США на курс BTC и весь криптовалютный рынок.',
    createdAt: '2024-01-15T10:30:00Z',
    author: 'Crypto Analyst',
    newsCount: 15,
    profitability: {
      positive: 8.7,
      negative: -2.3
    }
  },
  'sample-report-1': {
    id: 'sample-report-1',
    title: 'Ethereum обновление London Fork',
    description: 'Подробный анализ влияния обновления London Fork на экосистему Ethereum и цену ETH.',
    createdAt: '2024-01-10T14:20:00Z',
    author: 'DeFi Expert',
    newsCount: 12,
    profitability: {
      positive: 12.1,
      negative: -5.4
    }
  }
};

export class ReportService {
  // Получить все отчеты
  static getAllReports(): ReportData[] {
    return Object.values(MOCK_REPORTS);
  }
  
  // Получить отчет по ID
  static getReportById(id: string): ReportData | null {
    return MOCK_REPORTS[id] || null;
  }
  
  // Получить список ID всех отчетов
  static getAllReportIds(): string[] {
    return Object.keys(MOCK_REPORTS);
  }
  
  // Добавить новый отчет (для будущего функционала)
  static addReport(report: ReportData): void {
    MOCK_REPORTS[report.id] = report;
  }
  
  // Экспорт данных для билда (используется в generate-reports.js)
  static exportForBuild() {
    return {
      reports: Object.values(MOCK_REPORTS),
      reportsMap: MOCK_REPORTS
    };
  }
  
  // Асинхронный метод для будущей интеграции с API
  static async fetchReportFromAPI(id: string): Promise<ReportData | null> {
    try {
      // В будущем здесь будет реальный API запрос
      // const response = await fetch(`/api/reports/${id}`);
      // return await response.json();
      
      // Пока возвращаем моковые данные
      return this.getReportById(id);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      return null;
    }
  }
}