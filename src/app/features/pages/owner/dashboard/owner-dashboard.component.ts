import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { ProviderApiService, ProviderProfileReadDto } from '../../../../core/services/api/provider-api.service';
import { OwnerStationApiService, OwnerStationReadDto } from '../../../../core/services/api/owner-station-api.service';
import { OwnerPortApiService, OwnerPortReadDto, OwnerPortUpdateDto } from '../../../../core/services/api/owner-port-api.service';
import { ConnectorType, CONNECTOR_TYPE_LABELS, PortStatus, VerificationStatus } from '../../../../core/models/enums';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent implements AfterViewChecked, OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  ports: OwnerPortReadDto[] = [];
  stations: OwnerStationReadDto[] = [];
  loading = true;
  loadError = '';

  editingPort:  OwnerPortReadDto | null = null;
  editForm: OwnerPortUpdateDto = { portCode:'', power:150, connectorType: ConnectorType.CCS2, pricePerKwh:0, markOutOfService:false };
  editSaving = false;
  editError = '';

  qrPort: OwnerPortReadDto | null = null;
  private qrDrawn = false;

  addingPort = false;
  addSaving = false;
  addError = '';
  newPort = { stationId: 0, id:'', speed:'150', price:'', connector: ConnectorType.CCS2 as ConnectorType, notes:'', images:[] as {url:string;name:string;file:File}[] };
  readonly connectorOptions = Object.entries(CONNECTOR_TYPE_LABELS).map(([value, label]) => ({ value: +value, label }));

  // ── Identity verification lockout ───────────────────────────────
  profile: ProviderProfileReadDto | null = null;
  get isLocked(): boolean { return !!this.profile && this.profile.verificationStatus !== VerificationStatus.Verified; }

  fixingVerification = false;
  fixFiles: { idFront: File|null; idFrontUrl: string; idBack: File|null; idBackUrl: string; selfie: File|null; selfieUrl: string } =
    { idFront: null, idFrontUrl: '', idBack: null, idBackUrl: '', selfie: null, selfieUrl: '' };
  fixError = '';
  fixOcrRunning = false;
  fixOcrResult: { passed: boolean; score: number; reason: string } | null = null;

  constructor(
    private providerApi: ProviderApiService,
    private ownerStationApi: OwnerStationApiService,
    private ownerPortApi: OwnerPortApiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadStationsAndPorts();
  }

  private loadProfile() {
    this.providerApi.getMyProfile().subscribe({
      next: (res) => { if (res.success) this.profile = res.data; },
      error: () => { /* if this fails, dashboard just won't show the lockout state — non-fatal */ }
    });
  }

  private loadStationsAndPorts() {
    this.loading = true;
    this.ownerStationApi.getMine().subscribe({
      next: (res) => {
        this.stations = res.data || [];
        this.loadPorts();
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your stations.';
      }
    });
  }

  private loadPorts() {
    this.ownerPortApi.getMine().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load your ports.'; return; }
        this.ports = res.data || [];
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your ports.';
      }
    });
  }

  statusLabel(s: PortStatus): string {
    return { [PortStatus.PendingApproval]:'Pending', [PortStatus.Available]:'Available', [PortStatus.Occupied]:'Busy',
              [PortStatus.Reserved]:'Reserved', [PortStatus.OutOfService]:'Out of Service', [PortStatus.Rejected]:'Rejected' }[s] || 'Unknown';
  }
  statusBadgeClass(s: PortStatus): string {
    if (s === PortStatus.Available) return 'badge-available';
    if (s === PortStatus.Occupied || s === PortStatus.Reserved) return 'badge-busy';
    if (s === PortStatus.PendingApproval) return 'badge-pending';
    return 'badge-out';
  }

  // ── QR data string unique per port ──────────────────────────────
  getQRData(p: OwnerPortReadDto): string {
    return `ELECTROWAY:PORT:${p.portCode}:SPEED:${p.power}:PRICE:${p.pricePerKwh}:STATION:${p.stationId}`;
  }

  ngAfterViewChecked() {
    if (this.qrPort && this.qrCanvas?.nativeElement && !this.qrDrawn) {
      this.qrDrawn = true;
      this.drawQR(this.qrCanvas.nativeElement, this.getQRData(this.qrPort));
    }
  }

  drawQR(canvas: HTMLCanvasElement, data: string) {
    const ctx = canvas.getContext('2d')!;
    const size = 200;
    const modules = 21;
    const cellSize = size / modules;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);

    const seed = data.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = (i: number) => ((seed * 9301 + i * 49297 + 233) % 233280) / 233280;

    ctx.fillStyle = '#000';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        const inTopLeft     = r < 8 && c < 8;
        const inTopRight    = r < 8 && c >= modules - 8;
        const inBottomLeft  = r >= modules - 8 && c < 8;
        if (inTopLeft || inTopRight || inBottomLeft) continue;
        if (rng(r * modules + c) > 0.5) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
    this.drawFinder(ctx, 0, 0, cellSize);
    this.drawFinder(ctx, (modules - 7) * cellSize, 0, cellSize);
    this.drawFinder(ctx, 0, (modules - 7) * cellSize, cellSize);
  }

  drawFinder(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, cell * 7, cell * 7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + cell, y + cell, cell * 5, cell * 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
  }

  // ── Edit ────────────────────────────────────────────────────────
  openEdit(p: OwnerPortReadDto) {
    this.editingPort = p;
    this.editError = '';
    this.editForm = { portCode: p.portCode, power: p.power, connectorType: p.connectorType, pricePerKwh: p.pricePerKwh, markOutOfService: p.status === PortStatus.OutOfService };
  }
  closeEdit() { this.editingPort = null; }
  saveEdit() {
    if (!this.editingPort || this.editSaving) return;
    this.editSaving = true;
    this.editError = '';

    this.ownerPortApi.update(this.editingPort.portId, this.editForm).subscribe({
      next: (res) => {
        this.editSaving = false;
        if (!res.success) { this.editError = res.message || 'Could not update this port.'; return; }
        const idx = this.ports.findIndex(p => p.portId === res.data.portId);
        if (idx > -1) this.ports[idx] = res.data;
        this.editingPort = null;
      },
      error: (err) => {
        this.editSaving = false;
        this.editError = err?.error?.message || 'Could not update this port.';
      }
    });
  }

  // ── QR modal ────────────────────────────────────────────────────
  openQR(p: OwnerPortReadDto) { this.qrPort = p; this.qrDrawn = false; }
  printQR() { window.print(); }
  downloadQR() {
    if (!this.qrCanvas?.nativeElement) return;
    const link = document.createElement('a');
    link.download = `QR-${this.qrPort?.portCode}.png`;
    link.href = this.qrCanvas.nativeElement.toDataURL('image/png');
    link.click();
  }

  // ── Add port ────────────────────────────────────────────────────
  openAddPort() {
    this.addingPort = true;
    this.addError = '';
    this.newPort = { stationId: this.stations[0]?.stationId || 0, id:'', speed:'150', price:'', connector: ConnectorType.CCS2, notes:'', images:[] };
  }
  closeAdd() { this.addingPort = false; }

  saveAdd() {
    if (this.addSaving) return;
    if (!this.newPort.stationId) { this.addError = 'Please add a station first.'; return; }
    this.addSaving = true;
    this.addError = '';

    this.ownerPortApi.create({
      stationId: this.newPort.stationId,
      portCode: this.newPort.id,
      power: +this.newPort.speed,
      connectorType: this.newPort.connector,
      pricePerKwh: +this.newPort.price,
      notes: this.newPort.notes,
      images: this.newPort.images.map(i => i.file)
    }).subscribe({
      next: (res) => {
        this.addSaving = false;
        if (!res.success) { this.addError = res.message || 'Could not add this port.'; return; }
        this.ports.unshift(res.data);
        this.addingPort = false;
      },
      error: (err) => {
        this.addSaving = false;
        // 400 with a clear "not verified" message lands here if OCR hasn't passed.
        this.addError = err?.error?.message || 'Could not add this port.';
      }
    });
  }

  onImagesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(f => this.addImagePreview(f));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) return;
    Array.from(files).forEach(f => { if (f.type.startsWith('image/')) this.addImagePreview(f); });
  }

  private addImagePreview(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => this.newPort.images.push({ url: e.target?.result as string, name: f.name, file: f });
    reader.readAsDataURL(f);
  }

  removeImage(i: number, event: Event) { event.stopPropagation(); this.newPort.images.splice(i, 1); }

  // ── Fix verification (re-submit KYC docs when OCR previously failed) ─
  openFixVerification() {
    this.fixFiles = { idFront: null, idFrontUrl: '', idBack: null, idBackUrl: '', selfie: null, selfieUrl: '' };
    this.fixError = '';
    this.fixOcrResult = null;
    this.fixingVerification = true;
  }
  closeFixVerification() { this.fixingVerification = false; }

  onFixFileSelected(event: Event, field: 'idFront' | 'idBack' | 'selfie') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    (this.fixFiles as any)[field] = file;
    const reader = new FileReader();
    reader.onload = (e) => { (this.fixFiles as any)[`${field}Url`] = e.target?.result as string; };
    reader.readAsDataURL(file);
  }
  removeFixImage(field: 'idFront' | 'idBack' | 'selfie', event: Event) {
    event.stopPropagation();
    (this.fixFiles as any)[field] = null;
    (this.fixFiles as any)[`${field}Url`] = '';
  }
  get fixVerificationComplete(): boolean {
    return !!(this.fixFiles.idFront && this.fixFiles.idBack && this.fixFiles.selfie);
  }

  resubmitVerification() {
    if (!this.fixVerificationComplete) {
      this.fixError = 'Please upload all three images before resubmitting.';
      return;
    }
    this.fixError = '';
    this.fixOcrRunning = true;
    this.fixOcrResult = null;

    this.providerApi.resubmitVerification(this.fixFiles.idFront!, this.fixFiles.idBack!, this.fixFiles.selfie!).subscribe({
      next: (res) => {
        this.fixOcrRunning = false;
        if (!res.success) { this.fixError = res.message || 'Verification failed. Please try again.'; return; }

        this.fixOcrResult = { passed: res.data.verificationStatus === VerificationStatus.Verified, score: res.data.score, reason: res.data.reason };
        if (this.profile) this.profile.verificationStatus = res.data.verificationStatus;

        if (this.fixOcrResult.passed) {
          setTimeout(() => { this.fixingVerification = false; }, 1200);
        }
      },
      error: (err) => {
        this.fixOcrRunning = false;
        this.fixError = err?.error?.message || 'Verification failed. Please try again.';
      }
    });
  }
}
