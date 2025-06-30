import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { Stock }            from '../../..//core/services/dashboard.service';

@Component({
  selector: 'app-ticker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.scss'],
})
export class TickerComponent {
  /** Array coming from DashboardService */
  @Input() symbols: Stock[] = [];

  /* trackBy avoids full re-renders when prices update */
  track(_: number, s: Stock) { return s.symbol; }
}
