import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drinkService } from '../../services/drinkService';
import { queryKeys } from './queryKeys';
import { Drink } from '../../types';

export const useDrinks = () => {
  return useQuery<Drink[], Error>({
    queryKey: queryKeys.drinks.all,
    queryFn: () => drinkService.getDrinks(),
  });
};

export const useDrinkById = (id: string) => {
  return useQuery<Drink, Error>({
    queryKey: queryKeys.drinks.detail(id),
    queryFn: () => drinkService.getDrinkById(id),
    enabled: !!id,
  });
};

export const useCreateDrink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (drinkData: Drink) => {
      return drinkService.createDrink(drinkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drinks.all });
    },
  });
};

export const useUpdateDrink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, drinkData }: { id: string; drinkData: Drink }) => {
      return drinkService.updateDrink(id, drinkData);
    },
    onSuccess: (updatedDrink) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drinks.detail(updatedDrink.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.drinks.all });
    },
  });
};

export const useDeleteDrink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return drinkService.deleteDrink(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drinks.all });
    },
  });
};
