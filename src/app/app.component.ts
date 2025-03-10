import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignupComponent } from './signup/signup.component';

@Component({
  selector: 'app-root',
  standalone: true,  // ✅ Keep standalone enabled
  imports: [RouterOutlet, SignupComponent],  // ✅ Add SignupComponent
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'bullionx-frontend';
}
