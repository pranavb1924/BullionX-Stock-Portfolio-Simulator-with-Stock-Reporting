/* src/app/core/services/dashboard.service.ts - Updated with Watchlist Management */
import { Injectable, OnDestroy }         from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, BehaviorSubject } from 'rxjs';

import { AuthService }                   from './auth.service';
import { environment }                   from '../../../environments/environment';

/* ────────────────────  Interfaces  ──────────────────── */
export interface Stock {
  symbol: string;
  name:   string;
  price:  number;
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
  totalValue:       number;
  dayGain:          number;
  dayGainPercent:   number;
  totalGain:        number;
  totalGainPercent: number;
  cashBalance:      number;
}

/* ────────────────────  Service  ──────────────────── */
@Injectable({ providedIn: 'root' })
export class DashboardService implements OnDestroy {

  /* ---------- demo / fallback data ---------- */
  public holdings: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0, shares: 50 }
  ];
  public trendingStocks: Stock[] = [ 
    { "symbol": "AAPL", "name": "Apple Inc.", "price": 208.14, "change": 1.45, "changePercent": 0.70 },
    { "symbol": "TSLA", "name": "Tesla Inc.", "price": 353.38, "change": 31.22, "changePercent": 9.69 },
    { "symbol": "HIMS", "name": "Hims & Hers Health, Inc.", "price": 43.89, "change": -20.35, "changePercent": -31.68 },
    { "symbol": "LCID", "name": "Lucid Group, Inc.", "price": 2.17, "change": -0.02, "changePercent": -0.91 },
    { "symbol": "NVDA", "name": "NVIDIA Corporation", "price": 144.38, "change": 0.53, "changePercent": 0.37 },
    { "symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "price": 129.74, "change": 1.49, "changePercent": 1.16 },
    { "symbol": "INTC", "name": "Intel Corporation", "price": 21.12, "change": 0.04, "changePercent": 0.19 },
    { "symbol": "PLTR", "name": "Palantir Technologies Inc.", "price": 140.12, "change": 2.82, "changePercent": 2.05 },
    { "symbol": "NU", "name": "Nu Holdings Ltd.", "price": 12.22, "change": 0.08, "changePercent": 0.66 },
    { "symbol": "F", "name": "Ford Motor Company", "price": 10.72, "change": 0.13, "changePercent": 1.23 },
    { "symbol": "AAL", "name": "American Airlines Group Inc.", "price": 10.41, "change": -0.21, "changePercent": -1.97 },
    { "symbol": "SMCI", "name": "Super Micro Computer, Inc.", "price": 43.08, "change": -2.24, "changePercent": -4.94 },
    { "symbol": "RKLB", "name": "Rocket Lab USA, Inc.", "price": 32.34, "change": 2.30, "changePercent": 7.66 },
    { "symbol": "SOFI", "name": "SoFi Technologies, Inc.", "price": 15.07, "change": -0.13, "changePercent": -0.85 },
    { "symbol": "GOOGL", "name": "Alphabet Inc.", "price": 162.91, "change": -3.73, "changePercent": -2.24 },
    { "symbol": "AMZN", "name": "Amazon.com, Inc.", "price": 209.91, "change": 0.22, "changePercent": 0.10 },
    { "symbol": "META", "name": "Meta Platforms, Inc.", "price": 695.77, "change": 13.42, "changePercent": 1.96 },
    { "symbol": "NFLX", "name": "Netflix, Inc.", "price": 1248.51, "change": 17.13, "changePercent": 1.39 },
    { "symbol": "COST", "name": "Costco Wholesale Corporation", "price": 997.54, "change": 17.25, "changePercent": 1.76 },
    { "symbol": "WMT", "name": "Walmart Inc.", "price": 96.93, "change": 0.82, "changePercent": 0.85 },
    { "symbol": "MSFT", "name": "Microsoft Corporation", "price": 487.01, "change": 9.61, "changePercent": 2.01 }
  ];

  // Watchlist management
  private watchlist: Stock[] = [];
  private watchlistSubject = new BehaviorSubject<Stock[]>([]);
  public watchlist$ = this.watchlistSubject.asObservable();
  private readonly MAX_WATCHLIST_SIZE = 5;

  private news: NewsItem[] = [
    { time: '10 : 30', title: 'Markets open higher on earnings beat', source: 'Reuters' },
    { time: '09 : 45', title: 'Tech leads futures rally',             source: 'CNBC'    }
  ];

  /* ---------- bookkeeping ---------- */
  private userSub?       : Subscription;
  private updateInterval?: number;           // id returned by setInterval

  constructor(private auth: AuthService,
              private http: HttpClient) {
    // Load watchlist from localStorage on service initialization
    this.loadWatchlistFromStorage();
  }

  /* ───────────── lifecycle from component ───────────── */
  public init(): void {
    this.renderAll();
    this.patchHeaderWithUser();

    const syms = this.getUniqueSymbols();
    if (syms.length) { this.fetchProxyQuotes(syms); }

    this.setupEventListeners();
    this.startRealTimeUpdates();
  }

  public destroy(): void {
    clearInterval(this.updateInterval);
    this.userSub?.unsubscribe();
  }

  ngOnDestroy(): void { this.destroy(); }

  /* ───────────── WATCHLIST MANAGEMENT ───────────── */
  public addToWatchlist(stock: Stock): boolean {
    if (this.watchlist.length >= this.MAX_WATCHLIST_SIZE) {
      console.warn('Watchlist is full. Maximum 5 stocks allowed.');
      return false;
    }

    if (this.isInWatchlist(stock.symbol)) {
      console.warn(`${stock.symbol} is already in watchlist.`);
      return false;
    }

    this.watchlist.push({ ...stock });
    this.saveWatchlistToStorage();
    this.watchlistSubject.next([...this.watchlist]);
    this.renderWatchlist();
    
    console.log(`Added ${stock.symbol} to watchlist.`);
    return true;
  }

  public removeFromWatchlist(symbol: string): boolean {
    const index = this.watchlist.findIndex(stock => stock.symbol === symbol);
    if (index === -1) {
      console.warn(`${symbol} not found in watchlist.`);
      return false;
    }

    this.watchlist.splice(index, 1);
    this.saveWatchlistToStorage();
    this.watchlistSubject.next([...this.watchlist]);
    this.renderWatchlist();
    
    console.log(`Removed ${symbol} from watchlist.`);
    return true;
  }

  public isInWatchlist(symbol: string): boolean {
    return this.watchlist.some(stock => stock.symbol === symbol);
  }

  public isWatchlistFull(): boolean {
    return this.watchlist.length >= this.MAX_WATCHLIST_SIZE;
  }

  public getWatchlist(): Stock[] {
    return [...this.watchlist];
  }

  public getWatchlistCount(): number {
    return this.watchlist.length;
  }

  public getMaxWatchlistSize(): number {
    return this.MAX_WATCHLIST_SIZE;
  }

  private saveWatchlistToStorage(): void {
    try {
      localStorage.setItem('tradesim_watchlist', JSON.stringify(this.watchlist));
    } catch (error) {
      console.error('Failed to save watchlist to localStorage:', error);
    }
  }

  private loadWatchlistFromStorage(): void {
    try {
      const saved = localStorage.getItem('tradesim_watchlist');
      if (saved) {
        this.watchlist = JSON.parse(saved);
        this.watchlistSubject.next([...this.watchlist]);
      }
    } catch (error) {
      console.error('Failed to load watchlist from localStorage:', error);
      this.watchlist = [];
    }
  }

  /* ───────────── SEARCH FUNCTIONALITY ───────────── */
  public searchStocks(query: string): Stock[] {
    if (!query.trim()) {
      return this.trendingStocks.slice(0, 10);
    }

    const searchQuery = query.toLowerCase();
    return this.trendingStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery) || 
      stock.name.toLowerCase().includes(searchQuery)
    );
  }

  public getAllAvailableStocks(): Stock[] {
    return this.trendingStocks;
  }

  /* ───────────── helpers ───────────── */
  private getUniqueSymbols(): string[] {
    return [
      ...new Set([
        ...this.holdings, ...this.trendingStocks, ...this.watchlist
      ].map(s => s.symbol))
    ];
  }

  /* ───────────── USER → header ───────────── */
  private patchHeaderWithUser(): void {
    this.userSub = this.auth.currentUser$.subscribe(u => {
      const nameEl   = document.getElementById('userName');
      const avatarEl = document.getElementById('userAvatar');

      const fullname = u ? `${u.firstName} ${u.lastName}` : 'Guest';
      const initials = u ? (u.firstName[0] + u.lastName[0]).toUpperCase() : '--';

      if (nameEl)   nameEl.textContent   = fullname;
      if (avatarEl) avatarEl.textContent = initials;
    });
  }

  /* ───────────── QUOTES (→ Spring proxy) ───────────── */
  /** Calls our Spring-Boot proxy `/api/quotes?symbols=AAPL,MSFT…`   */
  private fetchProxyQuotes(symbols: string[]): void {
    const url    = `${environment.api}${environment.quoteEndpoint}`;
    const joined = symbols.join(',');
  
    this.http.get<any>(url, { params: { symbols: joined } }).subscribe({
      next: res => {
        /* ---- ❶ normalise response ------------------------------------ */
        const quotesObj = res.quotes ?? {};              // { AAPL:{…}, MSFT:{…} }
        const quotesArr = Object.keys(quotesObj).map(sym => ({
          symbol : sym,
          price  : quotesObj[sym].price,
          change : quotesObj[sym].change,
          changePercent : quotesObj[sym].changePct
        }));
  
        /* ---- ❷ merge into every local collection --------------------- */
        quotesArr.forEach(q => {
          [this.holdings, this.trendingStocks, this.watchlist].forEach(arr => {
            const i = arr.findIndex(s => s.symbol === q.symbol);
            if (i !== -1) arr[i] = { ...arr[i], ...q };
          });
        });
  
        /* ---- ❸ re-render affected widgets ---------------------------- */
        this.renderHoldings();
        this.renderTicker();
        this.renderWatchlist();
        this.updatePortfolioMetrics();
      },
  
      error:  (err: HttpErrorResponse) => {
        console.error('Proxy quote fetch failed →', err.message);
        this.useMockData();
      }
    });
  }

  /* ───────────── background polling ───────────── */
  private startRealTimeUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      const syms = this.getUniqueSymbols();
      if (syms.length) this.fetchProxyQuotes(syms);
    }, 120_000);   // every 2 min → well below Finnhub rate-limit
  }

  /* ───────────── MOCK fallback ───────────── */
  private useMockData(): void {
    const mock: Record<string, {price:number,change:number,changePercent:number}> = {
      AAPL:{price:199.8,change:1.2,changePercent:0.6},
      MSFT:{price:425.1,change:-2.3,changePercent:-0.54}
    };
    [this.holdings, this.trendingStocks, this.watchlist].forEach(arr => {
      arr.forEach(s => {
        if (mock[s.symbol]) Object.assign(s, mock[s.symbol]);
      });
    });
    this.renderAll();
  }

  /* ───────────── Rendering helpers ───────────── */
  private renderAll(): void {
    this.renderHoldings();
    this.renderTicker();
    this.renderWatchlist();
    this.renderNews();
    this.updatePortfolioMetrics();
  }

  private formatCurrency(v:number){return new Intl.NumberFormat('en-US',
    {style:'currency',currency:'USD'}).format(v);}
  private formatChange(v:number,pct=false){
    const sign=v>=0?'+':'';
    return `${sign}${v.toFixed(2)}${pct?'%':''}`;
  }

  /* ---------- holdings table ---------- */
  private renderHoldings(): void {
    const tbody=document.getElementById('holdingsTableBody'); if(!tbody)return;
    tbody.innerHTML=this.holdings.map(s=>{
      const tot=s.price*(s.shares??0);
      const cls=s.change>=0?'holding-positive':'holding-negative';
      return `<tr>
        <td><div class="stock-symbol">${s.symbol}</div>
            <div class="stock-name">${s.name}</div></td>
        <td>${s.shares}</td>
        <td>${this.formatCurrency(s.price)}</td>
        <td>${this.formatCurrency(tot)}</td>
        <td class="${cls}">${this.formatChange(s.change)}</td>
        <td class="${cls}">${this.formatChange(s.changePercent,true)}</td>
      </tr>`;
    }).join('');
  }

  /* ---------- ticker ---------- */
  private renderTicker(): void {
    const el=document.getElementById('tickerContent'); if(!el)return;
    const html=this.trendingStocks.map(s=>{
      const cls=s.change>=0?'positive':'negative';
      return `<div class="ticker-item">
        <span class="ticker-symbol">${s.symbol}</span>
        <span>${this.formatCurrency(s.price)}</span>
        <span class="${cls}" style="margin-left:.5rem;">
          ${this.formatChange(s.changePercent,true)}
        </span></div>`;
    }).join('');
    el.innerHTML=html+html;
  }

  /* ---------- watch-list ---------- */
  private renderWatchlist(): void {
    const el=document.getElementById('watchlistContainer'); if(!el)return;
    if (this.watchlist.length === 0) {
      el.innerHTML = `
        <div class="empty-watchlist">
          <div class="empty-icon">👁️</div>
          <div class="empty-text">Your watchlist is empty</div>
          <div class="empty-hint">Add stocks to track their performance</div>
        </div>
      `;
      return;
    }

    el.innerHTML=this.watchlist.map(s=>{
      const cls=s.change>=0?'positive':'negative';
      return `<div class="watchlist-item">
        <div>
          <div class="stock-symbol">${s.symbol}</div>
          <div class="stock-name" style="font-size:.75rem;">${s.name}</div>
        </div>
        <div style="text-align:right;">
          <div>${this.formatCurrency(s.price)}</div>
          <div class="${cls}" style="font-size:.875rem;">
            ${this.formatChange(s.changePercent,true)}</div>
        </div>
        <button class="remove-stock-btn" onclick="window.removeFromWatchlist?.('${s.symbol}')" title="Remove from watchlist">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>`;
    }).join('');
  }

  /* ---------- news ---------- */
  private renderNews(): void {
    const el=document.getElementById('newsContainer'); if(!el)return;
    el.innerHTML=this.news.map(n=>`
      <div class="news-item">
        <div class="news-time">${n.time}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-source">${n.source}</div>
      </div>`).join('');
  }

  /* ---------- metrics ---------- */
  public calculateMetrics(): PortfolioMetrics {
    const port=this.holdings.reduce((s,x)=>s+x.price*(x.shares??0),0);
    const cash=15_234;
    const total=port+cash;
    const dayGain=this.holdings.reduce((s,x)=>s+x.change*(x.shares??0),0);
    return {
      totalValue:total,
      dayGain,
      dayGainPercent: port? (dayGain/port)*100:0,
      totalGain:25_430.5,
      totalGainPercent:25.43,
      cashBalance:cash
    };
  }
  private updatePortfolioMetrics():void{
    const m=this.calculateMetrics();
    this.setText('totalValue', this.formatCurrency(m.totalValue));
    this.setText('dayGain',    this.formatCurrency(m.dayGain));
    this.setText('cashBalance',this.formatCurrency(m.cashBalance));
  }
  private setText(id:string,v:string){
    const el=document.getElementById(id); if(el) el.textContent=v;
  }

  /* ---------- misc ---------- */
  private setupEventListeners():void{
    // Global function for removing from watchlist (used in rendered HTML)
    (window as any).removeFromWatchlist = (symbol: string) => {
      this.removeFromWatchlist(symbol);
    };

    document.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('click',e=>{
        console.log('Button clicked →',
          (e.target as HTMLElement).textContent?.trim());
      });
    });
  }
}