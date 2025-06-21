// src/app/core/services/dashboard.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Subscription }          from 'rxjs';
import { AuthService }           from './auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment }           from '../../../environments/environment';

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
export class DashboardService implements OnDestroy {

  /* ----- state: demo data ----- */
  // Initialize with demo data to prevent empty symbol errors
  private holdings: Stock[] = [
    { symbol: 'CHWY', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0, shares: 100 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 0, change: 0, changePercent: 0, shares: 50 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 0, change: 0, changePercent: 0, shares: 25 }
  ];

  private trendingStocks: Stock[] = [
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 0, change: 0, changePercent: 0 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 0, change: 0, changePercent: 0 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 0, change: 0, changePercent: 0 }
  ];

  private watchlist: Stock[] = [
    { symbol: 'META', name: 'Meta Platforms', price: 0, change: 0, changePercent: 0 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 0, change: 0, changePercent: 0 }
  ];

  private news: NewsItem[] = [
    { time: '10:30 AM', title: 'Markets open higher on positive earnings', source: 'Reuters' },
    { time: '9:45 AM', title: 'Fed signals rate decision coming', source: 'Bloomberg' },
    { time: '9:15 AM', title: 'Tech stocks lead pre-market gains', source: 'CNBC' },
    { time: '8:30 AM', title: 'Oil prices steady amid global uncertainty', source: 'WSJ' }
  ];

  private updateInterval: number | null = null;

  /* --- auth subscription --- */
  private userSub?: Subscription;

  /* DI */
  constructor(private auth: AuthService, private http: HttpClient) {}

  /* ------------------------------------------------------------------
     Life-cycle hooks (invoked from DashboardComponent)                */
  /* ------------------------------------------------------------------ */
  public init(): void {
    this.renderAll();
    this.patchHeaderWithUser();
    
    // Get unique symbols from all collections
    const symbols = this.getUniqueSymbols();
    
    // Only fetch if we have symbols
    if (symbols.length > 0) {
      this.fetchYahooQuotes(symbols);
    } else {
      console.warn('No symbols available for initial fetch');
    }
    
    this.setupEventListeners();
    this.startRealTimeUpdates();
  }

  public destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.userSub?.unsubscribe();
  }

  /* ------------------------------------------------------------------*
     Helper to get unique symbols                                      *
  /* ------------------------------------------------------------------*/
  private getUniqueSymbols(): string[] {
    return [
      ...new Set([
        ...this.holdings.map(s => s.symbol),
        ...this.trendingStocks.map(s => s.symbol),
        ...this.watchlist.map(s => s.symbol)
      ])
    ];
  }

  /* ------------------------------------------------------------------
     USER → HEADER                                                     */
  /* ------------------------------------------------------------------ */
  private patchHeaderWithUser(): void {
    this.userSub = this.auth.currentUser$.subscribe(u => {
      const nameEl   = document.getElementById('userName');
      const avatarEl = document.getElementById('userAvatar');

      const fullName = u ? `${u.firstName} ${u.lastName}` : 'Guest';
      const initials = u ? (u.firstName[0] + u.lastName[0]).toUpperCase() : 'GU';

      if (nameEl)   nameEl.textContent   = fullName;
      if (avatarEl) avatarEl.textContent = initials;
    });
  }

  /* ------------------------------------------------------------------
     Rendering helpers                                                 */
  /* ------------------------------------------------------------------ */
  private renderAll(): void {
    this.renderHoldings();
    this.renderTicker();
    this.renderWatchlist();
    this.renderNews();
    this.updatePortfolioMetrics();
  }

  private formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  }
  
  private formatChange(v: number, pct = false): string {
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}${pct ? '%' : ''}`;
  }

  /**
   * Bulk-fetch quotes with enhanced error handling and debugging
   */
  private startRealTimeUpdates(): void {
    const unique = this.getUniqueSymbols();
  
    if (unique.length === 0) {
      console.warn('No symbols available for real-time updates');
      return;
    }
  
    // IMPORTANT: Increase interval to avoid rate limiting
    // Yahoo Finance free tier typically allows ~100 requests per hour
    this.updateInterval = window.setInterval(() => {
      const currentSymbols = this.getUniqueSymbols();
      if (currentSymbols.length > 0) {
        this.refreshQuotes(currentSymbols);
      }
    }, 120_000); // Changed from 30s to 120s (2 minutes) to avoid rate limiting
  }
  
  // Add request throttling
  private lastRequestTime = 0;
  private minRequestInterval = 10000; // 10 seconds between requests
  
  private fetchYahooQuotes(symbols: string[]): void {
    if (!symbols || symbols.length === 0) {
      console.warn('No symbols to fetch quotes for');
      return;
    }
  
    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      console.warn(`Rate limiting: waiting ${this.minRequestInterval - timeSinceLastRequest}ms before next request`);
      setTimeout(() => this.fetchYahooQuotes(symbols), this.minRequestInterval - timeSinceLastRequest);
      return;
    }
  
    this.lastRequestTime = now;
    console.log('Fetching quotes for symbols:', symbols);
    
    const joined = symbols.join(',');
    const url = environment.yahooQuoteUrl;
  
    this.http.get<any>(url, { 
      params: { symbols: joined },
      observe: 'response',
      responseType: 'json' as 'json'
    })
    .subscribe({
      next: (response) => {
        console.log('Quote fetch successful');
        const res = response.body;
        
        if (!res || typeof res !== 'object') {
          console.error('Invalid response format:', res);
          this.useMockData();
          return;
        }
        
        const list = res.quoteResponse?.result ?? [];
        console.log('Parsed quotes:', list);
        
        if (list.length === 0) {
          console.warn('No quotes returned from API, using mock data');
          this.useMockData();
          return;
        }
        
        list.forEach((q: any) => {
          const quote = {
            symbol        : q.symbol,
            price         : q.regularMarketPrice || 0,
            change        : q.regularMarketChange || 0,
            changePercent : q.regularMarketChangePercent || 0
          };
  
          [this.holdings, this.trendingStocks, this.watchlist].forEach(arr => {
            const idx = arr.findIndex(s => s.symbol === quote.symbol);
            if (idx !== -1) {
              arr[idx] = { ...arr[idx], ...quote };
            }
          });
        });
  
        this.renderHoldings();
        this.renderTicker();
        this.renderWatchlist();
        this.updatePortfolioMetrics();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to fetch Yahoo quotes:', err);
        
        if (err.status === 500 && err.error?.message?.includes('429')) {
          console.error('Rate limited by Yahoo Finance. Using mock data and increasing request interval.');
          // Double the interval on rate limit
          this.minRequestInterval = Math.min(this.minRequestInterval * 2, 300000); // Max 5 minutes
        }
        
        console.log('Using mock data due to API error');
        this.useMockData();
      }
    });
  }

  /**
   * Mock data fallback when API fails
   */
  private useMockData(): void {
    const mockData: { [key: string]: any } = {
      'AAPL':  { price: 195.89, change: 2.15, changePercent: 1.11 },
      'MSFT':  { price: 425.22, change: -1.33, changePercent: -0.31 },
      'GOOGL': { price: 172.63, change: 0.87, changePercent: 0.51 },
      'TSLA':  { price: 246.38, change: 5.22, changePercent: 2.16 },
      'NVDA':  { price: 887.00, change: 12.50, changePercent: 1.43 },
      'AMZN':  { price: 178.35, change: -2.11, changePercent: -1.17 },
      'META':  { price: 512.48, change: 3.75, changePercent: 0.74 },
      'NFLX':  { price: 641.20, change: -4.30, changePercent: -0.67 }
    };

    // Update all collections with mock data
    [this.holdings, this.trendingStocks, this.watchlist].forEach(arr => {
      arr.forEach(stock => {
        const mockQuote = mockData[stock.symbol];
        if (mockQuote) {
          stock.price = mockQuote.price;
          stock.change = mockQuote.change;
          stock.changePercent = mockQuote.changePercent;
        }
      });
    });

    // Re-render with mock data
    this.renderHoldings();
    this.renderTicker();
    this.renderWatchlist();
    this.updatePortfolioMetrics();
  }

  /* ---- Holdings table ---- */
  private renderHoldings(): void {
    const tbody = document.getElementById('holdingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.holdings.map(s => {
      const total = s.price * (s.shares ?? 0);
      const cls   = s.change >= 0 ? 'holding-positive' : 'holding-negative';
      return `
        <tr>
          <td>
            <div class="stock-symbol">${s.symbol}</div>
            <div class="stock-name">${s.name}</div>
          </td>
          <td>${s.shares}</td>
          <td>${this.formatCurrency(s.price)}</td>
          <td>${this.formatCurrency(total)}</td>
          <td class="${cls}">${this.formatChange(s.change)}</td>
          <td class="${cls}">${this.formatChange(s.changePercent, true)}</td>
        </tr>`;
    }).join('');
  }

  /* ---- Scrolling ticker ---- */
  private renderTicker(): void {
    const el = document.getElementById('tickerContent');
    if (!el) return;

    const html = this.trendingStocks.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `
        <div class="ticker-item">
          <span class="ticker-symbol">${s.symbol}</span>
          <span>${this.formatCurrency(s.price)}</span>
          <span class="${cls}" style="margin-left:0.5rem;">
            ${this.formatChange(s.changePercent, true)}
          </span>
        </div>`;
    }).join('');

    el.innerHTML = html + html; // duplicate for seamless scroll
  }

  /* ---- Watch-list ---- */
  private renderWatchlist(): void {
    const el = document.getElementById('watchlistContainer');
    if (!el) return;

    el.innerHTML = this.watchlist.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      const watchListCls = s.change >= 0 ? 'watchlist-item-positive' : 'watchlist-item-negative';

      return `
        <div class="${watchListCls}">
          <div>
            <div class="stock-symbol">${s.symbol}</div>
            <div class="stock-name" style="font-size:0.75rem;">${s.name}</div>
          </div>
          <div style="text-align:right;">
            <div>${this.formatCurrency(s.price)}</div>
            <div class="${cls}" style="font-size:0.875rem;">
              ${this.formatChange(s.changePercent, true)}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- News ---- */
  private renderNews(): void {
    const el = document.getElementById('newsContainer');
    if (!el) return;

    el.innerHTML = this.news.map(n => `
      <div class="news-item">
        <div class="news-time">${n.time}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-source">${n.source}</div>
      </div>`).join('');
  }

  ngOnDestroy(): void {
    // delegate to the existing cleanup logic
    this.destroy();
  }

  /* ---- Portfolio metrics ---- */
  private calculateMetrics(): PortfolioMetrics {
    const portfolio = this.holdings.reduce((sum, s) => sum + s.price * (s.shares ?? 0), 0);
    const cash      = 15234.00;
    const total     = portfolio + cash;

    // Calculate actual day gain based on holdings
    const dayGain = this.holdings.reduce((sum, s) => {
      return sum + (s.change * (s.shares ?? 0));
    }, 0);
    
    const dayGainPercent = portfolio > 0 ? (dayGain / portfolio) * 100 : 0;

    return {
      totalValue: total,
      dayGain: dayGain,
      dayGainPercent: dayGainPercent,
      totalGain: 25430.50,
      totalGainPercent: 25.43,
      cashBalance: cash
    };
  }

  private updatePortfolioMetrics(): void {
    const m = this.calculateMetrics();
    this.setText('totalValue',  this.formatCurrency(m.totalValue));
    this.setText('dayGain',     this.formatCurrency(m.dayGain));
    this.setText('totalGain',   this.formatCurrency(m.totalGain));
    this.setText('cashBalance', this.formatCurrency(m.cashBalance));
  }

  private setText(id: string, v: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  /* ------------------------------------------------------------------
     Real-time updates
   ------------------------------------------------------------------ */
  private refreshQuotes(symbols: string[]): void {
    // Guard against empty symbols
    if (!symbols || symbols.length === 0) {
      console.warn('No symbols to refresh');
      return;
    }

    const url = environment.yahooQuoteUrl;
    const joined = symbols.join(',');

    this.http.get<any>(url, { params: { symbols: joined } }).subscribe({
      next: res => {
        const quotes = res.quoteResponse?.result ?? [];

        quotes.forEach((q: any) => {
          const patch = {
            price         : q.regularMarketPrice || 0,
            change        : q.regularMarketChange || 0,
            changePercent : q.regularMarketChangePercent || 0,
          };

          // Update *every* collection
          [this.holdings, this.trendingStocks, this.watchlist].forEach(arr => {
            const idx = arr.findIndex(s => s.symbol === q.symbol);
            if (idx !== -1) {
              // Flash the updated cell
              this.flashUpdatedPrice(arr[idx].symbol, patch.change >= 0);
              arr[idx] = { ...arr[idx], ...patch };
            }
          });
        });

        // Re-render affected widgets
        this.renderHoldings();
        this.renderTicker();
        this.renderWatchlist();
        this.updatePortfolioMetrics();
      },
      error: err => {
        console.warn('Yahoo quote refresh failed →', err);
        // Don't use mock data for refresh failures - keep existing data
      }
    });
  }

 
  private flashCell(el: HTMLElement, positive: boolean): void {
    el.style.color = positive ? '#00ff88' : '#ff4444';
    setTimeout(() => {
      el.style.color = '';
    }, 1000);
  }

  private flashUpdatedPrice(symbol: string, positive: boolean): void {
    // Find all elements displaying this symbol's price
    const elements = document.querySelectorAll(`[data-symbol="${symbol}"]`);
    elements.forEach(el => this.flashCell(el as HTMLElement, positive));
  }

  /* ---- Quick dummy button handlers ---- */
  private setupEventListeners(): void {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const txt = (e.target as HTMLElement).textContent?.trim() ?? '';
        console.log('Button clicked →', txt);
        
        // Add some sample button handlers
        switch(txt) {
          case 'Add Funds':
            console.log('Add funds clicked');
            break;
          case 'Buy':
            console.log('Buy clicked');
            break;
          case 'Sell':
            console.log('Sell clicked');
            break;
        }
      });
    });
  }

  /* ---- Public helpers to mutate state externally ---- */
  public addToWatchlist(stock: Stock): void {
    if (!this.watchlist.find(s => s.symbol === stock.symbol)) {
      this.watchlist.push(stock);
      this.renderWatchlist();
      
      // Fetch quote for new symbol
      this.fetchYahooQuotes([stock.symbol]);
    }
  }

  public removeFromWatchlist(symbol: string): void {
    this.watchlist = this.watchlist.filter(s => s.symbol !== symbol);
    this.renderWatchlist();
  }

  public buyStock(symbol: string, shares: number, price: number): void {
    const existingStock = this.holdings.find(s => s.symbol === symbol);
    
    if (existingStock) {
      existingStock.shares = (existingStock.shares || 0) + shares;
    } else {
      // Add new holding
      const stockInfo = [...this.trendingStocks, ...this.watchlist]
        .find(s => s.symbol === symbol);
      
      if (stockInfo) {
        this.holdings.push({
          ...stockInfo,
          shares: shares
        });
      }
    }
    
    this.renderHoldings();
    this.updatePortfolioMetrics();
    console.log(`Bought ${shares} shares of ${symbol} at ${price}`);
  }

  public sellStock(symbol: string, shares: number): void {
    const stock = this.holdings.find(s => s.symbol === symbol);
    
    if (stock && stock.shares) {
      stock.shares -= shares;
      
      // Remove from holdings if no shares left
      if (stock.shares <= 0) {
        this.holdings = this.holdings.filter(s => s.symbol !== symbol);
      }
      
      this.renderHoldings();
      this.updatePortfolioMetrics();
      console.log(`Sold ${shares} shares of ${symbol}`);
    }
  }

  /* ---- Test method to verify service is working ---- */
  public testService(): void {
    console.log('Dashboard Service Test:');
    console.log('Holdings:', this.holdings);
    console.log('Watchlist:', this.watchlist);
    console.log('Trending:', this.trendingStocks);
    console.log('Unique symbols:', this.getUniqueSymbols());
  }
}