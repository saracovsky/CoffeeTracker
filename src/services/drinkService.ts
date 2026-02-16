import { apiService } from './apiService';
import { API_ENDPOINTS } from '../config/api';
import { Drink } from '../types';

class DrinkService {
  async getDrinks(): Promise<Drink[]> {
    try {
      const drinks = await apiService.get<Drink[]>(API_ENDPOINTS.DRINKS);
      return drinks;
    } catch (error) {
      throw error;
    }
  }
  async getDrinkById(id: string): Promise<Drink> {
    try {
      const drink = await apiService.get<Drink>(`${API_ENDPOINTS.DRINKS}/${id}`);
      return drink;
    } catch (error) {
      throw error;
    }
  }
  async createDrink(drink: Drink): Promise<Drink> {
    try {
      const createdDrink = await apiService.post<Drink>(API_ENDPOINTS.DRINKS, drink);
      return createdDrink;
    } catch (error) {
      throw error;
    }
  }
  async updateDrink(id: string, drink: Drink): Promise<Drink> {
    try {
      const updatedDrink = await apiService.put<Drink>(`${API_ENDPOINTS.DRINKS}/${id}`, drink);
      return updatedDrink;
    } catch (error) {
      throw error;
    }
  }
  async deleteDrink(id: string): Promise<void> {
    try {
      await apiService.delete<void>(`${API_ENDPOINTS.DRINKS}/${id}`);
    } catch (error) {
      throw error;
    }
  }
}

export const drinkService = new DrinkService();
export { DrinkService };