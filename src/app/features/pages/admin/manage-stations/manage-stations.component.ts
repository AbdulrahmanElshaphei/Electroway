import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminPortsApiService, AdminPortListItemDto, AdminPortDetailsDto, AdminPortsPagedResponseDto } from '../../../../core/services/api/admin-ports-api.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-manage-stations',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './manage-stations.component.html',
  styleUrls: ['./manage-stations.component.css']
})
export class ManageStationsComponent implements OnInit {
  portTab = 'Pending';
  portsData: AdminPortsPagedResponseDto | null = null;
  rejectingPort: AdminPortListItemDto | AdminPortDetailsDto | null = null;
  portRejectReason = '';
  viewingPort: AdminPortDetailsDto | null = null;

  constructor(private portsApi: AdminPortsApiService) {}

  ngOnInit() { this.loadPorts(); }

  setTab(tab: string) {
    this.portTab = tab;
    this.loadPorts();
  }

  loadPorts() { 
    this.portsApi.getPorts({ tab: this.portTab }).subscribe({
      next: (data) => this.portsData = data,
      error: (err) => console.error('Failed to load ports', err)
    });
  }

  openViewPort(p: AdminPortListItemDto) { 
    this.portsApi.getPortDetails(p.portId).subscribe({
      next: (data) => this.viewingPort = data,
      error: (err) => alert('Failed to load port details: ' + err.message)
    });
  }

  closeViewPort() { this.viewingPort = null; }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  approvePort(p: AdminPortListItemDto | AdminPortDetailsDto) {
    this.portsApi.approvePort(p.portId).subscribe({
      next: () => {
        this.loadPorts();
        if (this.viewingPort?.portId === p.portId) this.viewingPort = null;
      },
      error: (err) => alert('Failed to approve port: ' + err.message)
    });
  }

  openRejectPort(p: AdminPortListItemDto | AdminPortDetailsDto) { this.rejectingPort = p; this.portRejectReason = ''; }
  closeRejectPort() { this.rejectingPort = null; }
  
  confirmRejectPort() {
    if (!this.rejectingPort || !this.portRejectReason) return;
    this.portsApi.rejectPort(this.rejectingPort.portId, this.portRejectReason).subscribe({
      next: () => {
        this.loadPorts();
        if (this.viewingPort?.portId === this.rejectingPort?.portId) this.viewingPort = null;
        this.rejectingPort = null;
      },
      error: (err) => alert('Failed to reject port: ' + err.message)
    });
  }
}

