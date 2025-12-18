
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be hashed
  role: UserRole;
  avatar?: string;
  companyName?: string;
  trialStartDate: string;
  subscriptionExpiryDate?: string; // Date when the paid subscription ends
  subscriptionStatus: SubscriptionStatus;
  redeemedCodes?: string[]; // New: Track used license codes to prevent replay attacks
}

export interface WorkshopSettings {
  name: string;
  legalName?: string; // Razão Social
  document: string; // CNPJ
  phone: string;
  email: string;
  website?: string;
  logo?: string; // Base64 string
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  policyTerms?: string; // Texto para rodapé (garantias, etc)
}

export interface Customer {
  id: string;
  userId: string; // Owner of this record
  name: string;
  phone: string;
  email: string;
  document: string; // CPF or CNPJ
  address: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  userId: string; // Owner of this record
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

export enum WorkOrderStatus {
  PENDING_QUOTE = 'Aguardando Orçamento',
  QUOTE_APPROVED = 'Orçamento Aprovado',
  IN_PROGRESS = 'Em Serviço',
  FINISHED = 'Finalizado',
  DELIVERED = 'Entregue',
  CANCELED = 'Cancelado'
}

export interface ServiceItem {
  id: string;
  description: string;
  price: number;
}

export interface WorkOrder {
  id: string;
  userId: string; // Owner of this record
  customerId: string;
  vehicleId: string;
  entryDate: string;
  exitDate?: string;
  status: WorkOrderStatus;
  description: string; // Problema relatado
  services: ServiceItem[];
  discount: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
}

export interface DashboardStats {
  pendingQuotes: number;
  inProgress: number;
  finished: number;
  monthlyRevenue: number;
  finishedToday: number; // New
  delayedOrders: number; // New
  revenueHistory: { name: string; value: number }[]; // New for charts
  statusDistribution: { name: string; value: number; color: string }[]; // New for charts
  workshopName?: string;
}

// --- FINANCEIRO REAL ---
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'ticket';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  description: string;
  externalReference?: string; // ID do Mercado Pago
}

// Mercado Pago Types
declare global {
  interface Window {
    MercadoPago: any;
  }
}
