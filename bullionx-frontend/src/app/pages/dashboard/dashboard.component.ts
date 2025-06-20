import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { DashboardService }             from '../../core/services/dashboard.service';
import { AuthService }                  from '../../core/services/auth.service';

@Component({
  selector   : 'app-dashboard',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls  : ['../../../styles/dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  /** derive the stream lazily so we don’t access `auth` too early */
  get user$() { return this.auth.currentUser$; }

  constructor(
    public  dash : DashboardService,
    private auth : AuthService
  ) {}

  ngOnInit(): void   { this.dash.init();    }
  ngOnDestroy(): void{ this.dash.destroy(); }
}
