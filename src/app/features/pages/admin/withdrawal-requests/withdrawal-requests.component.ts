import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminWithdrawalsApiService, AdminWithdrawalListItemDto } from '../../../../core/services/api/admin-withdrawals-api.service';

@Component({
  selector: 'app-withdrawal-requests',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './withdrawal-requests.component.html',
  styleUrls: ['./withdrawal-requests.component.css']
})
export class WithdrawalRequestsComponent implements OnInit {
  tab = 'Pending';
  requests: AdminWithdrawalListItemDto[] = [];
  pendingCount = 0;

  constructor(private withdrawalsApi: AdminWithdrawalsApiService) {}

  ngOnInit() {
    this.loadWithdrawals();
  }

  setTab(newTab: string) {
    this.tab = newTab;
    this.loadWithdrawals();
  }

  loadWithdrawals() {
    this.withdrawalsApi.getWithdrawals({ tab: this.tab }).subscribe({
      next: (data) => {
        this.requests = data.withdrawals;
        this.pendingCount = data.pendingCount;
      },
      error: (err) => console.error('Failed to load withdrawals', err)
    });
  }

  approve(w: AdminWithdrawalListItemDto) {
    this.withdrawalsApi.approveWithdrawal(w.withdrawalId).subscribe({
      next: () => {
        alert('✅ Approved! Notification sent to owner.');
        this.loadWithdrawals();
      },
      error: (err) => alert('Failed to approve: ' + err.message)
    });
  }

  reject(w: AdminWithdrawalListItemDto) {
    const r = prompt('Reason for rejection:');
    if (r) {
      this.withdrawalsApi.rejectWithdrawal(w.withdrawalId, r).subscribe({
        next: () => {
          alert('❌ Rejected. Notification sent to owner.');
          this.loadWithdrawals();
        },
        error: (err) => alert('Failed to reject: ' + err.message)
      });
    }
  }

  getMethodIcon(method: string): string {
    if (method.toLowerCase().includes('bank')) return 'bi-bank';
    if (method.toLowerCase().includes('wallet')) return 'bi-wallet2';
    return 'bi-credit-card';
  }
}

