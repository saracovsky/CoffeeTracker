import { create } from 'zustand';
import { MenuItem, User, CartItem, Order, Transaction, MenuFilters, UserListItem, UserSelectionMode, AppState, AdminUser, StudentUser} from '../types';

interface CoffeeAppState {
  // Admin user state (no balance)
  user: User | null;
  isLoggedIn: boolean;
  transactions: Transaction[];

  // App flow state
  appState: AppState;
  
  // Menu state
  menuItems: MenuItem[];
  cart: CartItem[];
  
  // Order state
  orders: Order[];

  // Filter state
  filters: MenuFilters;

  // User list state
  userList: UserListItem[];
  userSelection: UserSelectionMode;

  // Student management
  selectedCustomer: UserListItem | null;
  
  // Admin actions
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;
  
  // Student balance management
  addFundsToStudent: (studentId: string, amount: number, description: string) => Promise<boolean>;
  
  // Menu/Cart actions
  setMenuItems: (items: MenuItem[]) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  
  // Order actions
  placeOrder: () => Promise<boolean>;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  getFilteredMenuItems: () => MenuItem[];

  // User list actions
  fetchUserList: () => Promise<UserListItem[]>;
  selectUser: (userId: string, purpose: 'buy_for' | 'view_profile') => void;
  clearUserSelection: () => void;
  setSelectedCustomer: (customer: UserListItem | null) => void;
}

export const useCoffeeStore = create<CoffeeAppState>((set, get) => ({
  // Initial state
  user: null,
  isLoggedIn: false,
  transactions: [],
  menuItems: [],
  cart: [],
  orders: [],

  // App flow state
  appState: {
    currentFlow: 'admin_login',
    adminUser: null,
  },

  // User list state
  userList: [],
  userSelection: {
    isSelecting: false,
    selectedUserId: null,
    purpose: null,
  },

  // Student management
  selectedCustomer: null,

  //Initialize filters
  filters: {
    searchQuery: '',
    selectedCategory: null,
    categories: [],
  },
  
  // Admin actions
  loginUser: (email, name) => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'admin', // Admin role
      createdAt: new Date(),
    };
    
    set({ 
      user: newUser, 
      isLoggedIn: true,
      transactions: [] // No transactions for admin
    });
  },
  
  logoutUser: () => set({ 
    user: null, 
    isLoggedIn: false, 
    cart: [], 
    transactions: [],
    orders: [],
    selectedCustomer: null
  }),
  
  // Student balance management
  addFundsToStudent: async (studentId, amount, description) => {
    const { userList } = get();
    const student = userList.find(u => u.id === studentId);

    if (!student) {
      console.error('Student not found:', studentId);
      return false;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: studentId,
      adminId: get().user?.id, // Track which admin added the funds
      type: 'topup',
      amount,
      description,
      createdAt: new Date(),
    };

    set((currentState) => ({
      userList: currentState.userList.map(u =>
        u.id === studentId ? { ...u, balance: u.balance + amount } : u
      ),
      transactions: [transaction, ...currentState.transactions],
    }));

    return true;
  },
  
  // Menu/Cart actions (unchanged)
  setMenuItems: (items) => {
  const categories = Array.from(new Set(items.map(item => item.category)));
  set({ 
    menuItems: items,
    filters: {
      ...get().filters,
      categories
    }
  });
},

setSearchQuery: (query) => set((state) => ({
  filters: { ...state.filters, searchQuery: query }
})),

setSelectedCategory: (category) => set((state) => ({
  filters: { ...state.filters, selectedCategory: category }
})),

getFilteredMenuItems: () => {
  const { menuItems, filters } = get();
  
  return menuItems.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false);
    
    // Category filter
    const matchesCategory = !filters.selectedCategory || item.category === filters.selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
},
  
  addToCart: (item) => set((state) => {
    const existingItem = state.cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      return {
        cart: state.cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      };
    }
    return {
      cart: [...state.cart, { ...item, quantity: 1 }]
    };
  }),
  
  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== itemId)
  })),
  
  clearCart: () => set({ cart: [] }),

  // User list actions
  fetchUserList: async () => {
    try {
      // TODO: Replace with real API call
      const mockUserList: UserListItem[] = [
        {
          id: '1',
          name: 'Alice Smith',
          email: 'alice.smith@tum.de',
          balance: 15.50,
          isActive: true,
          lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          role: 'user',
        },
        {
          id: '2', 
          name: 'Bob Johnson',
          email: 'bob.johnson@tum.de',
          balance: 22.75,
          isActive: true,
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          role: 'user',
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol.davis@tum.de', 
          balance: 8.25,
          isActive: false,
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          role: 'user',
        },
        {
          id: '5',
          name: 'Eva Brown',
          email: 'eva.brown@tum.de',
          balance: 12.30,
          isActive: true,
          lastSeen: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          role: 'user',
        },
      ];
      
      set({ userList: mockUserList });
      return mockUserList; // Return the result for better error handling
    } catch (error) {
      console.error('Failed to fetch user list:', error);
      throw error; // Re-throw for proper error handling in components
    }
  },
  
  selectUser: (userId, purpose) => set({
    userSelection: {
      isSelecting: true,
      selectedUserId: userId,
      purpose,
    }
  }),
  
  clearUserSelection: () => set({
    userSelection: {
      isSelecting: false,
      selectedUserId: null,
      purpose: null,
    }
  }),
  
  setSelectedCustomer: (customer) => {
    console.log('Store: Setting selected customer:', customer?.name);
    console.log('Store: Previous selectedCustomer:', get().selectedCustomer?.name);
    set({ selectedCustomer: customer });
    console.log('Store: New selectedCustomer:', get().selectedCustomer?.name);
  },
  
  // Order placement with balance deduction
  placeOrder: async () => {
    const state = get();
    if (state.cart.length === 0) return false;
    
    // Admin can only order for selected students, not for themselves
    if (!state.selectedCustomer) {
      console.error('No student selected for ordering');
      return false;
    }
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Check if selected student has enough funds
    if (state.selectedCustomer.balance < total) {
      return false; // Insufficient funds
    }
    
    // Create order
    const orderId = Date.now().toString();
    const order: Order = {
      id: orderId,
      userId: state.selectedCustomer.id,
      items: [...state.cart],
      total,
      createdAt: new Date(),
    };
    
    // Deduct funds from the selected student
    set((currentState) => ({
      selectedCustomer: {
        ...currentState.selectedCustomer!,
        balance: currentState.selectedCustomer!.balance - total,
      },
      userList: currentState.userList.map(u =>
        u.id === state.selectedCustomer!.id 
          ? { ...u, balance: u.balance - total }
          : u
      ),
      orders: [order, ...currentState.orders],
      cart: [], // Clear cart after successful order
    }));
    
    return true;
  },

}));