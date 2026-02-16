import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import { ApiError } from '../services/apiService';
import { useConditionalCallback } from '../utils/conditionalMemo';


// Hook return type
interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User | null>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
}

// Custom hook for managing users
export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users function
  const fetchUsers = useConditionalCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create user function
  const createUser = useConditionalCallback(async (userData: Partial<User>): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to create user';
      setError(errorMessage);
      console.error('Error creating user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user function
  const updateUser = useConditionalCallback(async (id: string, userData: Partial<User>): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await userService.updateUser(id, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === id ? updatedUser : user)
      );
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update user';
      setError(errorMessage);
      console.error('Error updating user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete user function
  const deleteUser = useConditionalCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await userService.deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
