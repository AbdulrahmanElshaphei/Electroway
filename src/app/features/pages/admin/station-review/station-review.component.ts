import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminPortsApiService, AdminPortDetailsDto } from '../../../../core/services/api/admin-ports-api.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-station-review',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './station-review.component.html',
  styleUrls: ['./station-review.component.css']
})
export class StationReviewComponent implements OnInit {
  showReject = false; 
  rejectReason = ''; 
  customMsg = '';
  port: AdminPortDetailsDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private portsApi: AdminPortsApiService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPort(parseInt(id, 10));
      }
    });
  }

  loadPort(id: number) {
    this.portsApi.getPortDetails(id).subscribe({
      next: (data) => this.port = data,
      error: (err) => console.error('Failed to load port details', err)
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  approve() { 
    if (!this.port) return;
    this.portsApi.approvePort(this.port.portId).subscribe({
      next: () => {
        alert('✅ Port approved! Notification sent to owner.');
        this.router.navigate(['/admin/stations']);
      },
      error: (err) => alert('Failed to approve port: ' + err.message)
    });
  }

  confirmReject() { 
    if (!this.port || !this.rejectReason) return;
    this.portsApi.rejectPort(this.port.portId, this.rejectReason).subscribe({
      next: () => {
        alert('❌ Rejection sent to owner.');
        this.router.navigate(['/admin/stations']);
      },
      error: (err) => alert('Failed to reject port: ' + err.message)
    });
  }

  sendMsg() { 
    alert('Message sent to owner: "' + this.customMsg + '"'); 
    this.customMsg = ''; 
  }
}

