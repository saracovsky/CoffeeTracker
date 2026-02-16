import { create } from 'zustand';
import { MenuItem, User, Transaction, MenuFilters, UserListItem, UserSelectionMode, AppState } from '../types';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { drinkService } from '../services/drinkService';
import * as Sentry from '@sentry/react-native';

interface CoffeeAppState {
  // Admin user state 
  user: User | null;
  isLoggedIn: boolean;
  transactions: Transaction[];

  // App flow state
  appState: AppState;
  
  // Menu state
  menuItems: MenuItem[];

  // Filter state
  filters: MenuFilters;

  // User list state
  userList: UserListItem[];
  userSelection: UserSelectionMode;

  //PIN Verification state
  pinVerifiedUserId: string | null;
  verifiedPin: string | null;
  verifySelectedUserPin: (pin: string) => Promise<boolean>;
  clearPinVerification: () => void;
  updateUserPin: (userId: string, oldPin: string, newPin: string) => Promise<boolean>;

  // Student management
  selectedCustomer: UserListItem | null;
  
  // Admin actions
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;
  
  // Menu actions
  setMenuItems: (items: MenuItem[]) => void;
  fetchMenuItems: () => Promise<void>;
  fetchTransactionHistory: (userId: string) => Promise<Transaction[]>;
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
  pinVerifiedUserId: null,
  verifiedPin: null,

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
      role: 'admin',
      createdAt: new Date(),
    };
    
    set({ 
      user: newUser, 
      isLoggedIn: true,
      transactions: []
    });
  },
  
  logoutUser: async () => {
    try {
      // Logout from backend
      await authService.logout();
    } catch (error) {
      console.error('Backend logout failed:', error);
    }
    
    set({
      user: null,
      isLoggedIn: false,
      transactions: [],
      selectedCustomer: null,
      userList: []
    });
  },
  
  // Menu actions
  setMenuItems: (items) => {
  const categories = Array.from(new Set(items.map(item => item.category)));
  set({ 
    menuItems: items,
    filters: {
      ...get().filters,
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

  // User list actions
  fetchUserList: async () => {
    try {
      Sentry.addBreadcrumb({
        category: 'data_fetch',
        message: 'Starting to fetch user list',
        level: 'info',
        data: {
          timestamp: new Date().toISOString(),
        },
      });
      const backendUsers = await userService.getAllUsers();

      Sentry.addBreadcrumb({
        category: 'data_fetch',
        message: 'Received user data from backend',
        level: 'info',
        data: {
          userCount: backendUsers.length,
          hasData: backendUsers.length > 0,
        },
      });
      
      // Transform backend users to UserListItem format
      const userList: UserListItem[] = (backendUsers as any[]).map(u => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        balance: u.balance ?? 0,
        isActive: true,
        lastSeen: undefined,
        role: 'user',
        has_pin: !!u.has_pin,
      }));

      set({ userList });
      return userList;
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'data_fetch',
        message: 'Failed to fetch user list',
        level: 'error',
        data: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      console.error('Failed to fetch user list from backend:', error);
      return [];
    }
  },
  
  selectUser: (userId, purpose) => set({
    userSelection: {
      isSelecting: true,
      selectedUserId: userId,
      purpose,
    },
    pinVerifiedUserId: null,
    verifiedPin: null,
  }),
  
  clearUserSelection: () => set({
    userSelection: {
      isSelecting: false,
      selectedUserId: null,
      purpose: null,
    }
  }),
  
  setSelectedCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  fetchMenuItems: async () => {
    // Breadcrumb for starting fetch
    Sentry.addBreadcrumb({
      category: 'data_fetch',
      message: 'Fetching menu items',
      level: 'info',
    });

    try {
    const drinks = await drinkService.getDrinks();
    
    if (drinks.length === 0) {
      Sentry.captureMessage('Menu items fetched but empty', {
        level: 'warning',
        tags: {
          data_issue: 'empty_menu',
          screen: 'StudentsScreen',
        },
      });
    }

    const menuItems: MenuItem[] = drinks.map(drink => ({
      id: drink.id,
      name: drink.name,
      price: drink.price,
      category: drink.category || undefined,
      description: drink.description || undefined,
    }));

    // Extract unique categories from drinks, filter out null/undefined
    const categories = Array.from(
      new Set(drinks.map(drink => drink.category).filter((cat): cat is string => !!cat))
    );

    set({ menuItems, filters: { ...get().filters, categories } });
    
    Sentry.addBreadcrumb({
      category: 'data_fetch',
      message: 'Menu items set successfully',
      level: 'info',
      data: {
        itemCount: menuItems.length,
        categoryCount: categories.length,
      },
    });

  } catch (error) {
    // Catch expected error: Network failure
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        error_type: 'menu_fetch_failure',
        api_endpoint: 'getDrinks',
        screen: 'StudentsScreen',
      },
      extra: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        adminUser: get().user?.email,
      },
    });
    
    console.error('Failed to fetch menu items:', error);
    
    // Set empty menu to prevent app crash
    set({ 
      menuItems: [], 
      filters: { ...get().filters, categories: [] } 
    });
    
    // Re-throw to let UI handle it
    throw error;
  }
},
  
  fetchTransactionHistory: async (userId: string) => {
    try {
      const transactions = await userService.getStudentTransactions(userId);
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
  }
},

  // PIN verification actions
  verifySelectedUserPin: async (pin: string) => {
    const state = get();
    const selected = state.selectedCustomer || state.userList.find(u => u.id === state.userSelection.selectedUserId) || null;
    // Catch expected error: No user selected
    if (!selected) {
      const error = new Error('PIN verification attempted without selected user');
      
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          error_type: 'no_user_for_pin_verification',
          screen: 'PinModal',
        },
        extra: {
          selectedCustomerId: state.selectedCustomer?.id,
          userSelectionId: state.userSelection.selectedUserId,
          adminUser: state.user?.email,
        },
      });
      
      return false;
    }
    
    try {
      // Add breadcrumb for PIN attempt
      Sentry.addBreadcrumb({
        category: 'authentication',
        message: 'PIN verification attempt',
        level: 'info',
        data: {
          userId: selected.id,
          userName: selected.name,
        },
      });
      
      const ok = await userService.checkUserPin(selected.id, pin);
      
      if (ok) {
        // Success breadcrumb
        Sentry.addBreadcrumb({
          category: 'authentication',
          message: 'PIN verified successfully',
          level: 'info',
          data: {
            userId: selected.id,
          },
        });
        
        set({ pinVerifiedUserId: selected.id, verifiedPin: pin });
      } else {
        // Catch expected error: Wrong PIN
        const error = new Error('Incorrect PIN entered');
        
        Sentry.captureException(error, {
          level: 'info',
          tags: {
            error_type: 'incorrect_pin',
            screen: 'PinModal',
          },
          extra: {
            userId: selected.id,
            userName: selected.name,
            hasPin: selected.has_pin,
          },
          user: {
            id: selected.id,
            email: selected.email,
            username: selected.name,
          },
        });
      }
      
      return ok;
      
    } catch (error) {
      // Catch unexpected error: API failure
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          error_type: 'pin_verification_api_failure',
          api_endpoint: 'checkUserPin',
          screen: 'PinModal',
        },
        extra: {
          userId: selected.id,
          userName: selected.name,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        user: {
          id: selected.id,
          email: selected.email,
          username: selected.name,
        },
      });
      
      console.error('PIN verification API failed:', error);
      return false;
    }
  },

  clearPinVerification: () => set({ pinVerifiedUserId: null, verifiedPin: null }),

  updateUserPin: async (userId, oldPin, newPin) => {
    try {
      const success = await userService.updateUserPin(userId, oldPin, newPin);

      // Clear PIN verification state after successful PIN update
      // This forces the user to re-enter their new PIN for the next purchase
      if (success) {
        set({ pinVerifiedUserId: null, verifiedPin: null });
      }

      return success;
    } catch (error) {
      console.error('Failed to update PIN:', error);
      return false;
    }
  },

}));