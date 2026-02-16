// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  //BASE_URL: 'http://192.168.0.150:8080/api',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  USERS: '/users',
  DRINKS: '/drinks',
  BUY_DRINK: '/transactions/buy',
  
  USER_CHECK_PIN: (userId: string) => `/users/${userId}/check_pin`, 
  USER_TRANSACTIONS: (userId: string) => `/users/${userId}/transactions`,
  USER_UPDATE_PIN: (userId: string) => `/users/${userId}/pin`,
};
