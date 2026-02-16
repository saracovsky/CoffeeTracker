import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { LoginRequest, User } from '../types';
import { ApiError } from '../services/apiService';
import { useConditionalCallback } from '../utils/conditionalMemo';


// Hook return type
interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Custom hook for managing authentication
export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        const authenticated = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        
        setIsAuthenticated(authenticated);
        setUser(currentUser);
        
      } catch (err) {
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useConditionalCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.login(credentials);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useConditionalCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Logout failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error function
  const clearError = useConditionalCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  };
};
