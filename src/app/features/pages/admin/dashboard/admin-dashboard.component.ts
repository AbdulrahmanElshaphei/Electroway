import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminDashboardApiService, PendingPortsApprovalDto, RecentUserDto } from '../../../../core/services/api/admin-dashboard-api.service';
import { AdminPortsApiService } from '../../../../core/services/api/admin-ports-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: any[] = [];
  recentUsers: RecentUserDto[] = [];
  pendingPorts: PendingPortsApprovalDto[] = [];

  constructor(
    private dashboardApi: AdminDashboardApiService,
    private portsApi: AdminPortsApiService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dashboardApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = [
          { label: 'TOTAL USERS', value: data.totalUsers.toLocaleString(), trend: '↗ live', icon: 'bi-people-fill', bg: '#dbeafe', color: '#1d4ed8' },
          { label: 'TOTAL PORTS', value: data.totalPorts.toLocaleString(), trend: '↗ live', icon: 'bi-lightning-fill', bg: '#dcfce7', color: '#16a34a' },
          { label: 'REVENUE THIS MONTH', value: `$${data.revenueThisMonth.toLocaleString()}`, trend: '↗ live', icon: 'bi-currency-dollar', bg: '#fef3c7', color: '#92400e' },
          { label: 'ACTIVE SESSIONS', value: data.activeSessions.toLocaleString(), trend: '↗ live', icon: 'bi-activity', bg: '#ede9fe', color: '#7c3aed' },
        ];
        this.recentUsers = data.recentUsers;
        this.pendingPorts = data.pendingPortApprovals;
      },
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  approve(p: PendingPortsApprovalDto) {
    this.portsApi.approvePort(p.portId).subscribe({
      next: () => this.loadData(),
      error: (err) => alert('Failed to approve port: ' + err.message)
    });
  }

  reject(p: PendingPortsApprovalDto) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    this.portsApi.rejectPort(p.portId, reason).subscribe({
      next: () => this.loadData(),
      error: (err) => alert('Failed to reject port: ' + err.message)
    });
  }
}

