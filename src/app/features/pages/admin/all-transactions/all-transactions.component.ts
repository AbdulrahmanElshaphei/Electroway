import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminTransactionsApiService, AdminTransactionListItemDto } from '../../../../core/services/api/admin-transactions-api.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-all-transactions',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './all-transactions.component.html',
  styleUrls: ['./all-transactions.component.css']
})
export class AllTransactionsComponent implements OnInit {
  search = ''; 
  statusFilter = ''; 
  dateFrom = ''; 
  dateTo = '';

  transactions: AdminTransactionListItemDto[] = [];
  
  private searchSubject = new Subject<string>();

  constructor(private transactionsApi: AdminTransactionsApiService) {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.loadTransactions();
    });
  }

  ngOnInit() {
    this.loadTransactions();
  }

  onSearchChange() {
    this.searchSubject.next(this.search);
  }

  onFilterChange() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionsApi.getTransactions({
      search: this.search,
      status: this.statusFilter,
      startDate: this.dateFrom,
      endDate: this.dateTo
    }).subscribe({
      next: (data) => this.transactions = data.transactions,
      error: (err) => console.error('Failed to load transactions', err)
    });
  }

  exportCSV() {
    this.transactionsApi.exportCsv({
      search: this.search,
      status: this.statusFilter,
      startDate: this.dateFrom,
      endDate: this.dateTo
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `admin-transactions-${new Date().toISOString().slice(0,10)}.csv`; 
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => alert('Failed to export CSV: ' + err.message)
    });
  }
}

