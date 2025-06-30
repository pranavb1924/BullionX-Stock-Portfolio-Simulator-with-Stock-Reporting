// src/app/core/services/stock-search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Stock } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class StockSearchService {
  private searchUrl = `${environment.api}${environment.searchEndpoint}`;   // /api/search
  private quotesUrl = `${environment.api}${environment.quoteEndpoint}`;   // /api/quotes

  constructor(private http: HttpClient) {}

  /**
   * Partial-match search that returns up to 20 results,
   * hydrated with price / change / change % when available.
   */
  lookupWithQuotes(query: string): Observable<Stock[]> {
    // 1 ── hit /api/search
    return this.http
      .get<any[]>(`${this.searchUrl}?q=${encodeURIComponent(query)}`)
      .pipe(
        // keep only the first 20 matches, map to Stock with placeholders
        map(arr =>
          arr.slice(0, 20).map(r => ({
            symbol        : r.symbol,
            name          : r.description,
            price         : 0,
            change        : 0,
            changePercent : 0
          }))
        ),

        // 2 ── if we have zero matches, stop here
        switchMap(list => {
          if (list.length === 0) { return of(list); }

          // 3 ── call /api/quotes to hydrate prices for those symbols
          const symbolsCsv = list.map(s => s.symbol).join(',');
          return this.http
            .get<any>(`${this.quotesUrl}?symbols=${symbolsCsv}`)
            .pipe(
              map(resp => {
                const quoteMap = resp.quotes as Record<string, any>;

                return list.map(s => {
                  const q = quoteMap[s.symbol];
                  return q
                    ? {
                        ...s,
                        price         : q.price,
                        change        : q.change,
                        changePercent : q.changePct
                      }
                    : s;                           // fallback if quote missing
                });
              })
            );
        })
      );
  }
}
