import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminUsersApiService, AdminUserListItemDto } from '../../../../core/services/api/admin-users-api.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  search = '';
  roleFilter = '';
  statusFilter = '';
  users: AdminUserListItemDto[] = [];
  
  private searchSubject = new Subject<string>();

  constructor(private usersApi: AdminUsersApiService) {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.loadUsers();
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  onSearchChange() {
    this.searchSubject.next(this.search);
  }

  onFilterChange() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersApi.getUsers({
      search: this.search,
      role: this.roleFilter,
      status: this.statusFilter
    }).subscribe({
      next: (data) => this.users = data.users,
      error: (err) => console.error('Error loading users', err)
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  toggleStatus(u: AdminUserListItemDto) {
    if (u.status === 'Active') {
      this.usersApi.suspendUser(u.userId).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert('Failed to suspend user: ' + err.message)
      });
    } else {
      this.usersApi.activateUser(u.userId).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert('Failed to activate user: ' + err.message)
      });
    }
  }
}

