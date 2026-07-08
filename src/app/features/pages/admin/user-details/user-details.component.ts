import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminUsersApiService, AdminUserDetailsDto } from '../../../../core/services/api/admin-users-api.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  user: AdminUserDetailsDto | null = null;
  
  // Mock data for UI placeholders that don't have endpoints yet
  spent = '$132.40';
  sessions_list = [
    { station:'Mission Bay Supercharger', date:'Jun 7, 09:12', energy:'32.4 kWh', total:'$11.02' },
    { station:'Presidio Green Station',   date:'Jun 4, 17:48', energy:'41.2 kWh', total:'$16.07' },
    { station:'SoMa Garage Charging',     date:'Jun 1, 08:02', energy:'28.6 kWh', total:'$7.72' },
  ];
  notifications = [
    { icon:'bi-check-circle', bg:'#dcfce7', color:'#16a34a', title:'Account approved',   body:'Your account has been verified.',       time:'Jun 7' },
    { icon:'bi-bell',         bg:'#dbeafe', color:'#1d4ed8', title:'Booking confirmed',  body:'Mission Bay Supercharger · P-04A.',     time:'Jun 7' },
    { icon:'bi-credit-card',  bg:'#fef3c7', color:'#92400e', title:'Payment completed',  body:'$11.02 paid · TX-9F4A21E0.',            time:'Jun 7' },
  ];

  constructor(
    private route: ActivatedRoute,
    private usersApi: AdminUsersApiService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadUser(parseInt(id, 10));
      }
    });
  }

  loadUser(id: number) {
    this.usersApi.getUserDetails(id).subscribe({
      next: (data) => this.user = data,
      error: (err) => console.error('Failed to load user', err)
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  toggleSuspend() {
    if (!this.user) return;
    if (this.user.status === 'Active') {
      this.usersApi.suspendUser(this.user.userId).subscribe({
        next: () => this.loadUser(this.user!.userId),
        error: (err) => alert('Failed to suspend user: ' + err.message)
      });
    } else {
      this.usersApi.activateUser(this.user.userId).subscribe({
        next: () => this.loadUser(this.user!.userId),
        error: (err) => alert('Failed to activate user: ' + err.message)
      });
    }
  }

  banUser() {
    if(confirm('Ban this user?')) alert('User banned. (Backend integration pending for banning)');
  }
  
  sendNotif() {
    alert('Notification sent to ' + this.user?.fullName + ' (Backend integration pending)');
  }
}

