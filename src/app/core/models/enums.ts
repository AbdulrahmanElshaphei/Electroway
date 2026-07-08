// Mirrors ElctroWay.Enums.* exactly. The backend has no JsonStringEnumConverter
// configured, so every enum travels over the wire as a plain integer — these
// maps are the single source of truth for converting between the number the
// API sends/expects and a human label for the UI.

export enum ConnectorType {
  Type1 = 1,
  Type2 = 2,
  CCS1 = 3,
  CCS2 = 4,
  CHAdeMO = 5,
  Tesla = 6,
  GB_T = 7
}
export const CONNECTOR_TYPE_LABELS: Record<number, string> = {
  1: 'Type 1', 2: 'Type 2', 3: 'CCS1', 4: 'CCS2', 5: 'CHAdeMO', 6: 'Tesla', 7: 'GB/T'
};

export enum PortStatus {
  Available = 1,
  Occupied = 2,
  OutOfService = 3,
  PendingApproval = 4,
  Reserved = 5,
  Rejected = 6
}
export const PORT_STATUS_LABELS: Record<number, string> = {
  1: 'Available', 2: 'Busy', 3: 'Out of Service', 4: 'Pending', 5: 'Reserved', 6: 'Rejected'
};

export enum StationStatus {
  Active = 1,
  Inactive = 2
}

export enum BookingStatus {
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
  Completed = 4,
  Expired = 5
}
export const BOOKING_STATUS_LABELS: Record<number, string> = {
  1: 'Pending', 2: 'Confirmed', 3: 'Cancelled', 4: 'Completed', 5: 'Expired'
};

export enum SessionStatus {
  Started = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
  Failed = 5
}

export enum PaymentMethod {
  Cash = 1,
  CreditCard = 2,
  DebitCard = 3,
  VodafoneCash = 4,
  InstaPay = 5,
  Wallet = 6
}

export enum TransactionStatus {
  Pending = 1,
  Paid = 2,
  Failed = 3,
  Refunded = 4
}

export enum NotificationType {
  Booking = 1,
  Session = 2,
  Payment = 3,
  Review = 4,
  Approval = 5,
  Withdrawal = 6,
  System = 7
}
export const NOTIFICATION_TYPE_LABELS: Record<number, string> = {
  1: 'Booking', 2: 'Session', 3: 'Payment', 4: 'Review', 5: 'Approval', 6: 'Withdrawal', 7: 'System'
};

export enum VerificationStatus {
  Pending = 0,
  Processing = 1,
  Verified = 2,
  PendingReview = 3,
  Rejected = 4
}

export enum WithdrawalMethod {
  BankTransfer = 1,
  VodafoneCash = 2,
  InstaPay = 3
}

export enum WithdrawalStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Paid = 4
}
export const WITHDRAWAL_STATUS_LABELS: Record<number, string> = {
  1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Paid'
};

export enum DocumentType {
  NationalIdFront = 1,
  NationalIdBack = 2,
  SelfieWithId = 3
}

export enum DocumentStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}
