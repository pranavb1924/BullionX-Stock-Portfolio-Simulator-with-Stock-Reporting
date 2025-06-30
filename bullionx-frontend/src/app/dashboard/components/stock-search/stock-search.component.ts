import {
  Component, OnInit, OnDestroy, Input, Output,
  EventEmitter, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Subject, of, debounceTime, distinctUntilChanged,
         switchMap, takeUntil, map } from 'rxjs';

import { Stock } from '../../../core/services/dashboard.service';
import { StockSearchService } from '../../../core/services/stock-search.service';

@Component({
  selector      : 'app-stock-search',
  standalone    : true,
  imports       : [CommonModule, FormsModule],
  templateUrl   : './stock-search.component.html',
  styleUrls     : ['./stock-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockSearchComponent implements OnInit, OnDestroy {

  /* -------- Inputs / Outputs -------- */
  @Input()  availableStocks: Stock[] = [];
  @Output() stockSelected   = new EventEmitter<Stock>();

  /* -------- template-bound state -------- */
  searchQuery    = '';
  filteredStocks: Stock[] = [];
  isActive       = false;            // controls overlay + z-index

  /* -------- internal streams -------- */
  private destroy$     = new Subject<void>();
  private searchInput$ = new Subject<string>();

  constructor(private api: StockSearchService) {}

  /* ---------------- lifecycle ---------------- */
  ngOnInit(): void {
    /* default list = first 10 locals */
    this.filteredStocks = this.availableStocks.slice(0, 10);

    /* keystrokes → debounce → local filter → (optional) remote search */
    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => this.localThenRemote(q)),
        takeUntil(this.destroy$)
      )
      .subscribe(list => (this.filteredStocks = list));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------------- UI handlers ---------------- */
  onSearch(): void { this.searchInput$.next(this.searchQuery.trim()); }

  onFocus(): void { this.isActive = true; }

  onBlur(): void  { setTimeout(() => (this.isActive = false), 150); }

  closeSearch(): void { this.isActive = false; }

  selectStock(stock: Stock): void {
    this.stockSelected.emit(stock);
    this.resetBox();
  }

  /* ---------------- internals ---------------- */
  private resetBox() {
    this.searchQuery    = '';
    this.filteredStocks = this.availableStocks.slice(0, 10);
    this.isActive       = false;
  }

  /** local matches first, then proxy /search if we still have <20 */
  private localThenRemote(q: string) {
    if (!q) { return of(this.availableStocks.slice(0, 10)); }

    const qLower = q.toLowerCase();
    const local  = this.availableStocks
      .filter(s => s.symbol.toLowerCase().includes(qLower) ||
                   s.name  .toLowerCase().includes(qLower))
      .slice(0, 20);

    if (local.length === 20) { return of(local); }

    return this.api.lookupWithQuotes(q).pipe(
      map(remote =>
        [...local,
         ...remote.filter(r => !local.some(l => l.symbol === r.symbol))
        ].slice(0, 20)
      )
    );
  }

  /* only for pretty numbers in dropdown */
  formatCurrency(v: number) {
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
  }
  formatChange(v: number, pct = false) {
    const s = v >= 0 ? '+' : '';
    return `${s}${v.toFixed(2)}${pct ? '%' : ''}`;
  }
}
