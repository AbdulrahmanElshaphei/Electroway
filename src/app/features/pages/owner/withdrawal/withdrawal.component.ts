import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { WithdrawalApiService, WalletSummaryDto, WithdrawalReadDto } from '../../../../core/services/api/withdrawal-api.service';
import { WithdrawalMethod, WITHDRAWAL_STATUS_LABELS } from '../../../../core/models/enums';

@Component({
  selector: 'app-withdrawal',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './withdrawal.component.html',
  styleUrls: ['./withdrawal.component.css']
})
export class WithdrawalComponent implements OnInit {
  step = 1;
  method: WithdrawalMethod | null = null;
  amount = '';
  accountDetails = '';
  submitting = false;
  submitError = '';

  wallet: WalletSummaryDto | null = null;
  loadingWallet = true;
  lastRequest: WithdrawalReadDto | null = null;

  methods = [
    { id: WithdrawalMethod.BankTransfer, name:'Bank Transfer', desc:'Direct deposit to your bank account (2-3 days)', icon:'bi-bank',        bg:'#dbeafe', color:'#1d4ed8', placeholder:'Bank name, account number, account holder name' },
    { id: WithdrawalMethod.VodafoneCash, name:'Vodafone Cash',  desc:'Instant transfer to your Vodafone Cash wallet',  icon:'bi-wallet2',     bg:'#ede9fe', color:'#7c3aed', placeholder:'Vodafone Cash registered phone number' },
    { id: WithdrawalMethod.InstaPay,     name:'InstaPay',       desc:'Transfer via InstaPay (usually instant)',        icon:'bi-credit-card', bg:'#dcfce7', color:'#16a34a', placeholder:'InstaPay mobile number or IPA address' },
  ];

  constructor(private withdrawalApi: WithdrawalApiService) {}

  ngOnInit() { this.loadWallet(); }

  private loadWallet() {
    this.loadingWallet = true;
    this.withdrawalApi.getWallet().subscribe({
      next: (res) => { this.loadingWallet = false; if (res.success) this.wallet = res.data; },
      error: () => { this.loadingWallet = false; }
    });
  }

  getMethodName() { return this.methods.find(m => m.id === this.method)?.name || ''; }
  getMethodPlaceholder() { return this.methods.find(m => m.id === this.method)?.placeholder || ''; }
  statusLabel(s: number) { return WITHDRAWAL_STATUS_LABELS[s] || 'Unknown'; }

  get amountNum(): number { return +this.amount || 0; }
  get exceedsBalance(): boolean { return !!this.wallet && this.amountNum > this.wallet.availableBalance; }

  confirmWithdrawal() {
    if (this.submitting || this.method == null || !this.accountDetails || this.amountNum <= 0) return;
    if (this.exceedsBalance) return;

    this.submitting = true;
    this.submitError = '';

    this.withdrawalApi.request(this.amountNum, this.method, this.accountDetails).subscribe({
      next: (res) => {
        this.submitting = false;
        if (!res.success) { this.submitError = res.message || 'Could not submit withdrawal request.'; return; }
        this.lastRequest = res.data;
        this.step = 4;
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Could not submit withdrawal request.';
      }
    });
  }
}
