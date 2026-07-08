import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email    = '';
  password = '';
  errorMsg = '';
  loading  = false;
  showPass = false;

  constructor(private auth: AuthService) {}

  fillCreds(email: string, pass: string) {
    this.email    = email;
    this.password = pass;
    this.errorMsg = '';
  }

  login() {
    this.errorMsg = '';
    if (!this.email || !this.password) {
      this.errorMsg = 'Please enter your email and password.';
      return;
    }
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.auth.redirectAfterLogin();
        } else {
          this.errorMsg = result.message || 'Login failed.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Could not reach the server. Please try again.';
      }
    });
  }
}
