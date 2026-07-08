import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { OwnerActivityApiService, OwnerTransactionReadDto } from '../../../../core/services/api/owner-activity-api.service';

interface DisplayTransaction {
  id: string;
  driver: string;
  port: string;
  date: string;
  energy: string;
  total: string;
  fee: string;
  profit: string;
}

@Component({
  selector: 'app-owner-transactions',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './owner-transactions.component.html',
  styleUrls: ['./owner-transactions.component.css']
})
export class OwnerTransactionsComponent implements OnInit {
  transactions: DisplayTransaction[] = [];
  loading = true;
  loadError = '';

  constructor(private ownerActivityApi: OwnerActivityApiService) {}

  ngOnInit() {
    this.loading = true;
    this.ownerActivityApi.getMyTransactions().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load transactions.'; return; }
        this.transactions = (res.data || []).map(this.toDisplay);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load transactions.';
      }
    });
  }

  private toDisplay = (t: OwnerTransactionReadDto): DisplayTransaction => {
    const date = t.paidAt ? new Date(t.paidAt) : null;
    return {
      id: t.txCode,
      driver: t.driverName || '—',
      port: t.portCode,
      date: date ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—',
      energy: `${t.energyKwh} kWh`,
      total: `EGP ${t.amount.toFixed(2)}`,
      fee: `EGP ${t.platformFee.toFixed(2)}`,
      profit: `EGP ${t.ownerProfit.toFixed(2)}`
    };
  };

  exportCSV() {
    const headers = ['Transaction ID', 'Driver', 'Port ID', 'Date', 'Energy', 'Total', 'Platform Fee', 'Your Profit'];
    const rows = this.transactions.map(t =>
      [t.id, t.driver, t.port, t.date, t.energy, t.total, t.fee, t.profit]
    );
    this.downloadCSV([headers, ...rows], 'owner-transactions.csv');
  }

  private downloadCSV(data: string[][], filename: string) {
    const csv = data.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
