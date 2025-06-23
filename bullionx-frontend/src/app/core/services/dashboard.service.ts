/* src/app/core/services/dashboard.service.ts */
import { Injectable, OnDestroy }         from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription }                  from 'rxjs';

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
  private holdings: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0, shares: 50 }
  ];
  private trendingStocks: Stock[] = [];
  private watchlist: Stock[] = [];

  private news: NewsItem[] = [
    { time: '10 : 30', title: 'Markets open higher on earnings beat', source: 'Reuters' },
    { time: '09 : 45', title: 'Tech leads futures rally',             source: 'CNBC'    }
  ];

  /* ---------- bookkeeping ---------- */
  private userSub?       : Subscription;
  private updateInterval?: number;           // id returned by setInterval

  constructor(private auth: AuthService,
              private http: HttpClient) {}

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
        </div></div>`;
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
  private calculateMetrics(): PortfolioMetrics {
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
    document.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('click',e=>{
        console.log('Button clicked →',
          (e.target as HTMLElement).textContent?.trim());
      });
    });
  }
}
