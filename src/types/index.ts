export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance?: number;
  role: 'admin' | 'staff';
  createdAt: Date;
  has_pin?: boolean;
}

export interface MenuFilters {
  searchQuery: string;
  selectedCategory: string | null;
  categories: string[];
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  balance: number;
  isActive: boolean;
  lastSeen?: Date;
  role: 'user' | 'admin';
  has_pin: boolean;
}

export interface UserSelectionMode {
  isSelecting: boolean;
  selectedUserId: string | null;
  purpose: 'buy_for' | 'view_profile' | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  canManageUsers: boolean;
  canProcessOrders: boolean;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: Date;
  lastTopUp?: Date;       
  isActive: boolean;      
}

export interface AddMoneyRequest {
  studentId: string;
  amount: number;
  description: string;
  adminId: string;
}

export interface AppState {
  currentFlow: 'admin_login' | 'user_selection' | 'ordering';
  adminUser: AdminUser | null;
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  valid_until: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  tokenExpiry: string | null;
  user: User | null;
}

export interface Drink {
  id: string;
  name: string;
  icon?: string | null;
  price: number;
  stock?: number | null;
  category?: string | null;
  description?: string | null;
}
export interface PurchaseType {
  icon: string;
  name: string;
}

export type TransactionType =
  | { Purchase: PurchaseType }
  ;

export interface Transaction {
  id: string;
  timestamp: Date; 
  amount: number;
  transaction_type: TransactionType;
}