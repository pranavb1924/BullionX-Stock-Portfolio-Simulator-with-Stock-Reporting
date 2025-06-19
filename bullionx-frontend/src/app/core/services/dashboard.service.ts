import { Injectable } from '@angular/core';

/* ────────────────  Interfaces  ──────────────── */
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares?: number;
}

export interface NewsItem {
  time: string;
  title: string;
  source: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  dayGain: number;
  dayGainPercent: number;
  totalGain: number;
  totalGainPercent: number;
  cashBalance: number;
}

/* ────────────────  Service  ──────────────── */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  /* ----- state ----- */
  private holdings: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.',       price: 182.45, change:  2.35, changePercent:  1.30, shares: 150 },
    { symbol: 'MSFT', name: 'Microsoft Corp.',  price: 378.92, change: -1.23, changePercent: -0.32, shares:  85 },
    { symbol: 'GOOGL',name: 'Alphabet Inc.',    price: 142.18, change:  3.67, changePercent:  2.65, shares:  50 },
    { symbol: 'TSLA', name: 'Tesla Inc.',       price: 245.23, change: -5.44, changePercent: -2.17, shares:  40 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.',     price: 485.67, change: 12.89, changePercent:  2.73, shares:  25 }
  ];

  private trendingStocks: Stock[] = [
    { symbol: 'NVDA', name: 'NVIDIA',   price: 485.67, change: 12.89, changePercent:  2.73 },
    { symbol: 'AMD',  name: 'AMD',      price: 167.34, change:  5.22, changePercent:  3.22 },
    { symbol: 'META', name: 'Meta',     price: 345.12, change: -8.91, changePercent: -2.52 },
    { symbol: 'AMZN', name: 'Amazon',   price: 155.33, change:  2.11, changePercent:  1.38 },
    { symbol: 'COIN', name: 'Coinbase', price:  98.45, change: 15.67, changePercent: 18.93 },
    { symbol: 'PLTR', name: 'Palantir', price:  18.90, change:  1.45, changePercent:  8.31 }
  ];

  private watchlist: Stock[] = [
    { symbol: 'SPY', name: 'SPDR S&P 500', price: 445.23, change:  3.21, changePercent: 0.73 },
    { symbol: 'QQQ', name: 'Invesco QQQ',  price: 385.67, change:  4.55, changePercent: 1.19 },
    { symbol: 'BTC', name: 'Bitcoin',     price: 42567.89, change: 1234.56, changePercent: 2.99 },
    { symbol: 'ETH', name: 'Ethereum',    price:  2234.78, change: -45.32, changePercent: -1.99 }
  ];

  private news: NewsItem[] = [
    { time: '2 hours ago', title: 'Fed Signals Potential Rate Cut in Next Meeting',      source: 'Reuters'  },
    { time: '3 hours ago', title: 'Tech Stocks Rally on Strong Earnings Reports',        source: 'CNBC'     },
    { time: '5 hours ago', title: 'Oil Prices Surge Amid Middle East Tensions',          source: 'Bloomberg'},
    { time: '6 hours ago', title: 'Cryptocurrency Market Cap Reaches New 2024 High',     source: 'CoinDesk' },
    { time: '8 hours ago', title: 'Major Banks Report Better-Than-Expected Q2 Results',  source: 'WSJ'      }
  ];

  private updateInterval: number | null = null;

  /* ----- life-cycle hooks called from component ----- */
  /** call from `ngOnInit` */
  public init(): void {
    this.renderAll();
    this.setupEventListeners();
    this.startRealTimeUpdates();
  }

  /** call from `ngOnDestroy` */
  public destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /* ────────────────  Rendering helpers  ──────────────── */

  private renderAll(): void {
    this.renderHoldings();
    this.renderTicker();
    this.renderWatchlist();
    this.renderNews();
    this.updatePortfolioMetrics();
  }

  private formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(val);
  }
  private formatChange(val: number, pct = false): string {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}${pct ? '%' : ''}`;
  }

  /* ---- each DOM section ---- */
  private renderHoldings(): void {
    const tbody = document.getElementById('holdingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.holdings.map(s =>{
      const total = s.price * (s.shares ?? 0);
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `<tr>
        <td><div class="stock-symbol">${s.symbol}</div><div class="stock-name">${s.name}</div></td>
        <td>${s.shares}</td>
        <td>${this.formatCurrency(s.price)}</td>
        <td>${this.formatCurrency(total)}</td>
        <td class="${cls}">${this.formatChange(s.change)}</td>
        <td class="${cls}">${this.formatChange(s.changePercent,true)}</td>
      </tr>`;
    }).join('');
  }

  private renderTicker(): void {
    const el = document.getElementById('tickerContent');
    if (!el) return;
    const html = this.trendingStocks.map(s=>{
      const cls = s.change >= 0 ? 'positive':'negative';
      return `<div class="ticker-item">
        <span class="ticker-symbol">${s.symbol}</span>
        <span>${this.formatCurrency(s.price)}</span>
        <span class="${cls}" style="margin-left:.5rem;">${this.formatChange(s.changePercent,true)}</span>
      </div>`;
    }).join('');
    el.innerHTML = html + html;     // duplicate for seamless scroll
  }

  private renderWatchlist(): void {
    const el = document.getElementById('watchlistContainer');
    if (!el) return;
    el.innerHTML = this.watchlist.map(s=>{
      const cls = s.change>=0?'positive':'negative';
      return `<div class="watchlist-item">
        <div>
          <div class="stock-symbol">${s.symbol}</div>
          <div class="stock-name" style="font-size:.75rem;">${s.name}</div>
        </div>
        <div style="text-align:right;">
          <div>${this.formatCurrency(s.price)}</div>
          <div class="${cls}" style="font-size:.875rem;">${this.formatChange(s.changePercent,true)}</div>
        </div>
      </div>`;
    }).join('');
  }

  private renderNews(): void {
    const el = document.getElementById('newsContainer');
    if (!el) return;
    el.innerHTML = this.news.map(n=>`
      <div class="news-item">
        <div class="news-time">${n.time}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-source">${n.source}</div>
      </div>`).join('');
  }

  /* ---- portfolio metrics ---- */
  private calculateMetrics(): PortfolioMetrics {
    const port = this.holdings.reduce((sum,s)=>sum+(s.price*(s.shares??0)),0);
    const cash = 15234.00;
    const total = port + cash;
    return {
      totalValue: total,
      dayGain: 1245.80,
      dayGainPercent: 1.01,
      totalGain: 25430.50,
      totalGainPercent: 25.43,
      cashBalance: cash
    };
  }
  private updatePortfolioMetrics(): void {
    const m = this.calculateMetrics();
    this.setText('totalValue',  this.formatCurrency(m.totalValue));
    this.setText('dayGain',    this.formatCurrency(m.dayGain));
    this.setText('totalGain',  this.formatCurrency(m.totalGain));
    this.setText('cashBalance',this.formatCurrency(m.cashBalance));
  }
  private setText(id:string,val:string){ const e=document.getElementById(id); if(e) e.textContent=val; }

  /* ---- realtime sim ---- */
  private simulatePriceChanges(): void {
    const all = [...this.holdings,...this.trendingStocks,...this.watchlist];
    all.forEach(s=>{
      const pct = (Math.random()-0.5)*0.5;
      const change = s.price * (pct/100);
      s.price += change;
      s.change = change;
      s.changePercent = pct;
    });
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = window.setInterval(()=>{
      this.simulatePriceChanges();
      this.renderHoldings();
      this.renderTicker();
      this.renderWatchlist();
      this.updatePortfolioMetrics();
    },5000);
  }

  /* ---- clicks ---- */
  private setupEventListeners(): void {
    document.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('click', e=>{
        const txt = (e.target as HTMLElement).textContent?.trim() ?? '';
        console.log('Button clicked →',txt);
      });
    });
  }

  /* ---- public helpers (add / remove etc.) ---- */
  public addToWatchlist(stock: Stock){ this.watchlist.push(stock); this.renderWatchlist(); }
  public removeFromWatchlist(symbol:string){ this.watchlist=this.watchlist.filter(s=>s.symbol!==symbol); this.renderWatchlist(); }

  public buyStock(symbol:string, shares:number, price:number){ /* … */ }
  public sellStock(symbol:string, shares:number){ /* … */ }
}
