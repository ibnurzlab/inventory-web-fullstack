export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  type: TransactionType;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  date: string;
  partner: string;
  notes: string;
  createdById?: string | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

export interface ReportSummary {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  totalTransactions: number;
  totalIn: number;
  totalOut: number;
}

export interface TrendPoint {
  date: string;
  masuk: number;
  keluar: number;
}

export interface TopItem {
  itemId: string;
  code: string;
  name: string;
  unit: string;
  total: number;
}

export interface CategoryStat {
  category: string;
  itemCount: number;
  totalStock: number;
  lowStock: number;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface TransactionFilters {
  q?: string;
  type?: '' | TransactionType;
  start?: string;
  end?: string;
}

export interface ItemPayload {
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
}

export interface TransactionPayload {
  type: TransactionType;
  itemId: string;
  quantity: number;
  date: string;
  partner: string;
  notes?: string;
}
