export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: Date;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  adminId?: string; 
  type: 'topup' | 'purchase' | 'refund';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: Date;
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