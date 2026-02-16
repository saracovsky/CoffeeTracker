export const queryKeys = {
  // User-related keys
  users: {
    // All users list
    all: ['users'] as const,
    
    // Specific user by ID
    detail: (id: string) => [...queryKeys.users.all, id] as const,
    
    // Only students
    students: ['users', 'students'] as const,
    
    // Only admins
    admins: ['users', 'admins'] as const,
    
    // User's transactions
    transactions: (userId: string) => [...queryKeys.users.detail(userId), 'transactions'] as const,  },
  
  // Drink-related keys
  drinks: {
    // All drinks list
    all: ['drinks'] as const,
    
    // Specific drink by ID
    detail: (id: string) => [...queryKeys.drinks.all, id] as const,  },
  
  // Auth-related (if needed)
  auth: {
    // Current user session
    me: ['auth', 'me'] as const,
  },
};