export interface Stock {
    symbol: string;
    name:   string;
    price:  number;
    change: number;          // absolute $
    changePercent: number;   // percentage
    shares?: number;         // only for holdings
  }
  
  /* src/app/core/models/news-item.model.ts */
  export interface NewsItem {
    time:   string;          // e.g. “2 hours ago”  – we’ll switch to Date later
    title:  string;
    source: string;
  }
  
  /* src/app/core/models/portfolio-metrics.model.ts */
  export interface PortfolioMetrics {
    totalValue:        number;
    dayGain:           number;
    dayGainPercent:    number;
    totalGain:         number;
    totalGainPercent:  number;
    cashBalance:       number;
  }