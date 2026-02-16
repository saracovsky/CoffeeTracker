import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { User, StudentUser, AdminUser, Transaction } from '../types';

// User API Service
class UserService {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await apiService.get<User[]>(API_ENDPOINTS.USERS);
      return users;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const user = await apiService.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
      return user;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }

  // Create a new user
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const newUser = await apiService.post<User>(API_ENDPOINTS.USERS, userData);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await apiService.put<User>(`${API_ENDPOINTS.USERS}/${id}`, userData);
      return updatedUser;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      await apiService.delete(`${API_ENDPOINTS.USERS}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  // Get students only (if your backend has this endpoint)
  async getStudents(): Promise<StudentUser[]> {
    try {
      const students = await apiService.get<StudentUser[]>(`${API_ENDPOINTS.USERS}/students`);
      return students;
    } catch (error) {
      console.error('Failed to fetch students:', error);
      throw error;
    }
  }

  // Get admins only (if your backend has this endpoint)
  async getAdmins(): Promise<AdminUser[]> {
    try {
      const admins = await apiService.get<AdminUser[]>(`${API_ENDPOINTS.USERS}/admins`);
      return admins;
    } catch (error) {
      throw error;
    }
  }

  async getStudentTransactions(userId: string): Promise<Transaction[]> {
  try {
    const endpoint = API_ENDPOINTS.USER_TRANSACTIONS(userId);
    const transactions = await apiService.get<Transaction[]>(endpoint);
    return transactions;
  } catch (error) {
    throw error; 
  }
}

  async buyDrink(userId: string, drinkId: string, userPin?: string): Promise<User> {
    try {
      
      const endpoint = API_ENDPOINTS.BUY_DRINK;
      const body: any = {
        user: userId,
        drink: drinkId,
      };
      if (userPin) {
        body.user_pin = userPin;
      }

      const user = await apiService.post<User>(endpoint, body);
      return user;
    } catch (error) {
      throw error;
    }
  }

async checkUserPin(userId: string, pin: string): Promise<boolean> {
  try {
    const endpoint = API_ENDPOINTS.USER_CHECK_PIN(userId);
    const res = await apiService.post<boolean>(endpoint, { user_pin: pin });
    return res === true;
  } catch (error) {
    console.error('Failed to check pin:', error);
    throw error; 
  }
}
async updateUserPin(userId: string, oldPin: string, newPin: string): Promise<boolean> {
  try {
    const endpoint = API_ENDPOINTS.USER_UPDATE_PIN(userId);
    const res = await apiService.put<any>(endpoint, { 
      old_pin: oldPin, 
      new_pin: newPin 
    });
    
    // Handle different possible response formats
    if (res === true || res === 'true') return true;
    if (res?.success === true) return true;
    if (res?.valid === true) return true;
    if (res?.message === 'success') return true;
    
    return false;
  } catch (error) {
    throw error;
  }
}

}

export const userService = new UserService();

export { UserService };
