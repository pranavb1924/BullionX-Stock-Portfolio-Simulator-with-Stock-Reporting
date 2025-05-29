// src/app/pages/register/register.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm:  ['', Validators.required]
    }, {
      validators: this.passwordsMatch
    });
  }

  /** Custom validator: checks that password and confirm match */
  private passwordsMatch(group: FormGroup) {
    const pass = group.get('password')?.value;
    const conf = group.get('confirm')?.value;
    return pass === conf ? null : { mismatch: true };
  }

  /** Handle form submission */
  onSubmit() {
    if (this.form.valid) {
      console.log('Registration data:', this.form.value);
      // TODO: call your AuthService.register(this.form.value)
    } else {
      this.form.markAllAsTouched();
    }
  }
}
