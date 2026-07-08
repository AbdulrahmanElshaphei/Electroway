import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
@Component({ selector:'app-admin-settings', standalone:true, imports:[RouterModule,CommonModule,FormsModule,NavbarComponent], templateUrl:'./admin-settings.component.html', styleUrls:['./admin-settings.component.css'] })
export class AdminSettingsComponent {
  settings = { commission:10, minWithdrawal:50, maxWithdrawal:10000, adminEmail:'admin@electroway.app', newPass:'' };
  rules = [
    { label:'Require station approval',       desc:'New stations must be manually approved before going live.',         value:true },
    { label:'Auto-approve verified owners',   desc:'Owners with 3+ approved stations are auto-approved.',              value:false },
    { label:'Enable AI charging assistant',   desc:'Allow users to use the AI assistant on the map page.',             value:true },
    { label:'Allow digital wallet withdrawals',desc:'Owners can withdraw to PayPal, Venmo, and Cash App.',            value:true },
  ];
  templates = [
    { label:'✅ Station Approved',    message:'🎉 Congratulations! Your station "{{station_name}}" has been approved and is now live on the Electro Way map.' },
    { label:'❌ Station Rejected',    message:'Your station "{{station_name}}" was not approved. Reason: {{reason}}. You can edit and resubmit at any time.' },
    { label:'💰 Withdrawal Approved', message:'Your withdrawal of ${{amount}} has been approved and will arrive within 2-3 business days.' },
    { label:'❌ Withdrawal Rejected', message:'Your withdrawal request was rejected. Reason: {{reason}}. Please contact support for assistance.' },
    { label:'🚫 Account Suspended',   message:'Your account has been suspended. Please contact our support team to resolve this issue.' },
  ];
  save(section: string) { alert('✅ ' + section.charAt(0).toUpperCase() + section.slice(1) + ' settings saved!'); }
}
