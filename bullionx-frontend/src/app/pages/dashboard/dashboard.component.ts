import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { DashboardService, Stock }             from '../../core/services/dashboard.service';
import { AuthService }                         from '../../core/services/auth.service';
import { TickerComponent }                     from '../../dashboard/components/ticker/ticker.component';
import { PortfolioSummaryComponent }           from '../../dashboard/components/portfolio-summary/portfolio-summary.component';
import { StockSearchComponent }                from '../../dashboard/components/stock-search/stock-search.component';
import { StockCardComponent }                  from '../../dashboard/components/stock-card/stock-card.component';

@Component({
  selector   : 'app-dashboard',
  standalone : true,
  imports    : [
    CommonModule,
    TickerComponent,
    PortfolioSummaryComponent,
    StockSearchComponent,
    StockCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls  : [
    './dashboard.component.css',
    '../../../styles/dashboard.css'
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  get user$() { return this.auth.currentUser$; }

  trendingStocks: Stock[] = [];
  selectedStock: Stock | null = null;
  showStockCard = false;

  constructor(
    public  dash : DashboardService,
    private auth : AuthService
  ) {}

  ngOnInit(): void {
    this.dash.init();
    this.trendingStocks = this.dash.trendingStocks;
  }

  ngOnDestroy(): void {
    this.dash.destroy();
  }

  // Stock selection and modal
  onStockSelected(stock: Stock): void {
    this.selectedStock = stock;
    this.showStockCard = true;
  }

  closeStockCard(): void {
    this.showStockCard = false;
    this.selectedStock = null;
  }

  get isSelectedStockInWatchlist(): boolean {
    return this.selectedStock
      ? this.dash.isInWatchlist(this.selectedStock.symbol)
      : false;
  }

  // Watchlist management
  onAddToWatchlist(stock: Stock): void {
    if (this.dash.addToWatchlist(stock)) {
      console.log(`Added ${stock.symbol}`);
      this.closeStockCard();
    } else {
      console.error(`Failed to add ${stock.symbol}`);
    }
  }

  onRemoveFromWatchlist(stock: Stock): void {
    if (this.dash.removeFromWatchlist(stock.symbol)) {
      console.log(`Removed ${stock.symbol}`);
      this.closeStockCard();
    } else {
      console.error(`Failed to remove ${stock.symbol}`);
    }
  }

  onViewDetails(stock: Stock): void {
    console.log('View details for:', stock.symbol);
    this.closeStockCard();
  }
}
