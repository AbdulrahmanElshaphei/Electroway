import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChargeReceiptService, ChargeSession } from '../../../core/services/charge-receipt.service';
import { PaymentApiService, ReceiptReadDto } from '../../../core/services/api/payment-api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  session: ChargeSession;
  receipt: ReceiptReadDto | null = null;
  transactionId = 0;
  downloading = false;

  constructor(
    private receiptSvc: ChargeReceiptService,
    private route: ActivatedRoute,
    private paymentApi: PaymentApiService
  ) {
    this.session = this.receiptSvc.get();
  }

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.transactionId = q.get('transactionId') ? +q.get('transactionId')! : 0;

    if (this.transactionId) {
      this.paymentApi.getReceipt(this.transactionId).subscribe({
        next: (res) => { if (res.success) this.receipt = res.data; },
        error: () => { /* non-blocking — falls back to the cached session for the PDF */ }
      });
    }
  }

  private loadJsPDF(): Promise<any> {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (w.jspdf?.jsPDF) { resolve(w.jspdf.jsPDF); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => resolve(w.jspdf.jsPDF);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async downloadReceipt() {
    if (this.downloading) return;
    this.downloading = true;
    try {
      const jsPDF = await this.loadJsPDF();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const s = this.session;
      const r = this.receipt;
      const green = [22, 163, 74];
      const gray = [107, 114, 128];
      const dark = [17, 24, 39];

      const receiptCode = r?.receiptCode || s.transactionId;
      const stationName = r?.stationName || s.stationName;
      const portCode = r?.portCode || s.portId;
      const energyKwh = r?.energyKwh ?? s.energyKwh;
      const pricePerKwh = r?.pricePerKwh ?? s.pricePerKwh;
      const durationMin = r?.durationMinutes ?? s.durationMin;
      const total = r?.totalAmount ?? s.total;

      // Header band
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(0, 0, 595, 90, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('ElectroWay', 48, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Charging Receipt', 48, 68);

      let y = 130;
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Successful', 48, y);

      y += 14;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Thank you for using ElectroWay.', 48, y);

      y += 36;
      doc.setDrawColor(229, 231, 235);
      doc.line(48, y, 547, y);

      const rows: [string, string][] = [
        ['Receipt code', receiptCode],
        ['Station', stationName],
        ['Port ID', portCode],
        ['Date & time', s.dateTime],
        ['Session duration', `${durationMin} min`],
        ['Energy used', `${energyKwh} kWh`],
        ['Price per kWh', `EGP ${pricePerKwh}`],
        ['Payment method', s.cardLast4 ? `Card ending •• ${s.cardLast4}` : 'Card'],
      ];

      y += 28;
      doc.setFontSize(11);
      rows.forEach(([label, value]) => {
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 48, y);
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 547, y, { align: 'right' });
        y += 26;
      });

      y += 10;
      doc.setDrawColor(229, 231, 235);
      doc.line(48, y, 547, y);

      y += 34;
      doc.setFontSize(13);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Total paid', 48, y);
      doc.setTextColor(green[0], green[1], green[2]);
      doc.setFontSize(18);
      doc.text(`EGP ${total.toFixed(2)}`, 547, y, { align: 'right' });

      y += 60;
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('This receipt was generated electronically and is valid without a signature.', 48, y);

      doc.save(`ElectroWay-Receipt-${receiptCode}.pdf`);
    } finally {
      this.downloading = false;
    }
  }
}
