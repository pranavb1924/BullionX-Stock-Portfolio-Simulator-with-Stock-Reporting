import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { PortfolioMetrics, Stock } from '../../../core/services/dashboard.service';

@Component({
  selector   : 'app-portfolio-summary',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './portfolio-summary.component.html',
  styleUrls  : ['../../../../styles/dashboard.css']     // or point to shared css
})
export class PortfolioSummaryComponent {

  /** metrics + holdings arrive from the dashboard */
  @Input({ required: true }) summary!  : PortfolioMetrics;
  @Input({ required: true }) holdings!: Stock[];

  /** simple toggle */
  expanded = false;
  toggle() { this.expanded = !this.expanded; }
}
