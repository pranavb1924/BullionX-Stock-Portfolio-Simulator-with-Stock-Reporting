import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stock } from '../../../core/services/dashboard.service';

@Component({
  selector      : 'app-stock-card',
  standalone    : true,
  imports       : [CommonModule],
  templateUrl   : './stock-card.component.html',
  styleUrls     : ['./stock-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockCardComponent implements OnInit, OnChanges, OnDestroy {

  @Input() stock: Stock | null = null;
  @Input() isVisible       = false;
  @Input() isInWatchlist   = false;
  @Input() isWatchlistFull = false;

  @Output() close                   = new EventEmitter<void>();
  @Output() addToWatchlistEvent     = new EventEmitter<Stock>();
  @Output() removeFromWatchlistEvent= new EventEmitter<Stock>();
  @Output() viewDetailsEvent        = new EventEmitter<Stock>();

  /* stable fields */
  dayRange  = 'N/A';
  marketCap = 'N/A';
  volume    = 'N/A';
  peRatio   = 'N/A';

  /* ───────── lifecycle ───────── */
  ngOnInit(): void {
    window.addEventListener('keydown', this.handleEsc);
  }

  ngOnChanges(): void {
    if (!this.stock) { return; }
    const p = this.stock.price;

    this.dayRange  = `${this.formatCurrency(p * 0.95)} – ${this.formatCurrency(p * 1.05)}`;
    this.marketCap = this.humanCap(p * 1_000_000_000);
    this.volume    = this.humanVol(1_000_000 + Math.random() * 9_000_000);
    this.peRatio   = (10 + Math.random() * 40).toFixed(2);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleEsc);
  }

  private handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isVisible) this.closeModal();
  };

  /* ───────── UI actions ───────── */
  closeModal()          { this.close.emit(); }
  addToWatchlist()      { if (this.stock && !this.isInWatchlist && !this.isWatchlistFull) this.addToWatchlistEvent.emit(this.stock); }
  removeFromWatchlist() { if (this.stock &&  this.isInWatchlist) this.removeFromWatchlistEvent.emit(this.stock); }
  viewDetails()         { if (this.stock) this.viewDetailsEvent.emit(this.stock); }

  /* ───────── helpers ───────── */
  formatCurrency(v:number){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
  }
  formatChange(v:number, pct=false){
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}${pct ? '%' : ''}`;
  }
  humanCap(v:number){
    return v>=1e12 ? `$${(v/1e12).toFixed(2)}T`
         : v>=1e9  ? `$${(v/1e9 ).toFixed(2)}B`
         : v>=1e6  ? `$${(v/1e6 ).toFixed(2)}M`
         : 'N/A';
  }
  humanVol(v:number){
    return v>=1e6 ? `${(v/1e6).toFixed(2)}M`
         : v>=1e3 ? `${(v/1e3).toFixed(2)}K`
         : `${v}`;
  }
}
