import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',   // the HTML you pasted
  styleUrls: ['../../../styles/dashboard.css']     // or point to shared css
})
export class DashboardComponent implements OnInit, OnDestroy {

  constructor(public dash: DashboardService) {}

  ngOnInit(): void   { this.dash.init();    }
  ngOnDestroy(): void{ this.dash.destroy(); }
}
