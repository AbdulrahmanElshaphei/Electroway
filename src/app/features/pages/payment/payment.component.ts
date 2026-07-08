import { Component } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChargeReceiptService, ChargeSession } from '../../../core/services/charge-receipt.service';
import { PaymentApiService } from '../../../core/services/api/payment-api.service';
import { PaymentMethod } from '../../../core/models/enums';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {
  session: ChargeSession;
  sessionId = 0;

  cardName = '';
  cardNum = '';
  expiry = '';
  cvv = '';
  processing = false;
  payError = '';

  constructor(
    private receiptSvc: ChargeReceiptService,
    private router: Router,
    private route: ActivatedRoute,
    private paymentApi: PaymentApiService
  ) {
    this.session = this.receiptSvc.get();
    const q = this.route.snapshot.queryParamMap;
    this.sessionId = q.get('sessionId') ? +q.get('sessionId')! : 0;
  }

  get formValid(): boolean {
    return !!(this.cardName && this.cardNum.replace(/\s/g, '').length >= 12 && this.expiry && this.cvv.length >= 3);
  }

  pay() {
    if (!this.formValid || this.processing) return;

    if (!this.sessionId) {
      this.payError = 'Missing charging session — please go back to your receipt.';
      return;
    }

    this.processing = true;
    this.payError = '';

    this.paymentApi.pay({
      sessionId: this.sessionId,
      paymentMethod: PaymentMethod.CreditCard,
      cardHolderName: this.cardName,
      cardNumber: this.cardNum,
      expiry: this.expiry,
      cvv: this.cvv
    }).subscribe({
      next: (res) => {
        this.processing = false;
        if (!res.success) { this.payError = res.message || 'Payment failed. Please try again.'; return; }

        if (res.data.cardLast4) this.receiptSvc.setCardLast4(res.data.cardLast4);

        this.router.navigate(['/payment-success'], {
          queryParams: { transactionId: res.data.transactionId }
        });
      },
      error: (err) => {
        this.processing = false;
        this.payError = err?.error?.message || 'Payment failed. Please try again.';
      }
    });
  }
}
