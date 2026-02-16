import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { LoginRequest, LoginResponse, User } from '../types';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
};

class AuthService {
  private token: string | null = null;
  private tokenExpiry: string | null = null;
  private user: User | null = null;

  constructor() {
    this.initializeAuth();
  }

  // Initialize authentication state from storage
  private async initializeAuth() {
    try {
      const [token, expiry, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (token && expiry && userData) {
        // Check if token is still valid
        if (this.isTokenValid(expiry)) {
          this.token = token;
          this.tokenExpiry = expiry;
          this.user = JSON.parse(userData);
        } else {
          await this.clearAuthData();
        }
      }
    } catch (error) {
      await this.clearAuthData();
    }
  }

  // Check if token is still valid
  private isTokenValid(expiry: string): boolean {
    const expiryDate = new Date(expiry);
    const now = new Date();
    return expiryDate > now;
  }

  // Login method
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {      
      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
  
      // Store authentication data
      await this.storeAuthData(response);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Store authentication data
  private async storeAuthData(loginResponse: LoginResponse) {
    try {
      this.token = loginResponse.access_token;
      this.tokenExpiry = loginResponse.valid_until;

      // Store in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginResponse.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, loginResponse.valid_until),
      ]);

    } catch (error) {
      throw error;
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Get authorization header
  getAuthHeader(): Record<string, string> {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.token !== null && this.tokenExpiry !== null && this.isTokenValid(this.tokenExpiry);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Set current user (after successful login)
  setCurrentUser(user: User) {
    this.user = user;
    AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  // Logout method
  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // Clear authentication data
  private async clearAuthData() {
    this.token = null;
    this.tokenExpiry = null;
    this.user = null;

    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data from storage:', error);
    }
  }

  // Refresh token (if your backend supports it)
  async refreshToken(): Promise<LoginResponse | null> {
    try {
      if (!this.token) {
        throw new Error('No token to refresh');
      }

      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        {},
        this.getAuthHeader()
      );

      await this.storeAuthData(response);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuthData();
      return null;
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService();

// Export the class for testing purposes
export { AuthService };
