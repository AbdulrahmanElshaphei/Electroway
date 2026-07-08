import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface VerificationFiles {
  idFrontFile: File | null; idFrontUrl: string;
  idBackFile: File | null;  idBackUrl: string;
  selfieFile: File | null;  selfieUrl: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  step = 1;
  type: 'driver' | 'owner' | '' = '';
  fullName = ''; email = ''; phone = ''; password = ''; confirmPassword = '';
  errorMsg = '';
  submitting = false;

  // Egyptian mobile format: 01 followed by 9 digits (11 digits total)
  private readonly EG_PHONE_RE = /^01[0-9]{9}$/;

  // ── Owner verification (Step 3) ──────────────────────────────────────
  verification: VerificationFiles = { idFrontFile: null, idFrontUrl: '', idBackFile: null, idBackUrl: '', selfieFile: null, selfieUrl: '' };
  verifyError = '';
  ocrRunning = false;
  ocrResult: { passed: boolean; score: number; verificationStatus: string } | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  nextStep() { if (this.type) this.step = 2; }

  // Step 2 -> Step 3 (owner only) or finish (driver)
  continueFromDetails() {
    // Backend requires FullName to be at least 10 characters for both roles.
    if (!this.fullName || !this.email || !this.phone || !this.password || !this.confirmPassword) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }
    if (this.fullName.trim().length < 10) {
      this.errorMsg = 'Full name must be at least 10 characters.';
      return;
    }
    if (!this.EG_PHONE_RE.test(this.phone)) {
      this.errorMsg = 'Please enter a valid Egyptian phone number (e.g. 01XXXXXXXXX).';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }
    this.errorMsg = '';
    if (this.type === 'owner') {
      this.step = 3;
    } else {
      this.registerDriver();
    }
  }

  // ── Driver: simple JSON registration, then auto-login ────────────────
  private registerDriver() {
    this.submitting = true;
    this.errorMsg = '';

    this.auth.registerDriver({
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phone,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.submitting = false;
          this.errorMsg = res.message || 'Registration failed.';
          return;
        }
        this.loginAfterRegister();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  // ── Image pickers for ID front / back / selfie ──────────────────────
  onFileSelected(event: Event, field: 'idFront' | 'idBack' | 'selfie') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    (this.verification as any)[`${field}File`] = file;

    const reader = new FileReader();
    reader.onload = (e) => { (this.verification as any)[`${field}Url`] = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeImage(field: 'idFront' | 'idBack' | 'selfie', event: Event) {
    event.stopPropagation();
    (this.verification as any)[`${field}File`] = null;
    (this.verification as any)[`${field}Url`] = '';
  }

  get verificationComplete(): boolean {
    return !!(this.verification.idFrontFile && this.verification.idBackFile && this.verification.selfieFile);
  }

  // ── Owner: multipart submit (files + OCR), then auto-login ───────────
  submitVerification() {
    if (!this.verificationComplete) {
      this.verifyError = 'Please upload all three images (front ID, back ID, and a selfie) to continue.';
      return;
    }
    this.verifyError = '';
    this.ocrRunning = true;
    this.ocrResult = null;

    const formData = new FormData();
    formData.append('FullName', this.fullName);
    formData.append('Email', this.email);
    formData.append('Password', this.password);
    formData.append('ConfirmPassword', this.confirmPassword);
    formData.append('PhoneNumber', this.phone);
    formData.append('FrontId', this.verification.idFrontFile!);
    formData.append('BackId', this.verification.idBackFile!);
    formData.append('SelfieWithId', this.verification.selfieFile!);

    this.auth.registerProvider(formData).subscribe({
      next: (res) => {
        this.ocrRunning = false;

        // register-provider returns Ok() even on failure — must check
        // res.success explicitly rather than relying on HTTP status.
        if (!res.success) {
          this.verifyError = res.message || 'Registration failed. Please check your documents and try again.';
          return;
        }

        const status = res.data?.verificationStatus ?? 'Processing';
        this.ocrResult = {
          passed: status === 'Verified',
          score: res.data?.score ?? 0,
          verificationStatus: status
        };

        // Account is created regardless of OCR outcome — the owner
        // dashboard gates features based on verification status.
        this.loginAfterRegister();
      },
      error: (err) => {
        this.ocrRunning = false;
        this.verifyError = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  private loginAfterRegister() {
    // register-driver / register-provider don't return a JWT themselves —
    // log in right after with the same credentials to get the token.
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.auth.redirectAfterLogin();
        } else {
          this.errorMsg = 'Account created — please sign in.';
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.submitting = false;
        this.errorMsg = 'Account created — please sign in.';
        this.router.navigate(['/login']);
      }
    });
  }
}
