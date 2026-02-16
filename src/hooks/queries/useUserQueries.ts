import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { queryKeys } from './queryKeys';
import { User, StudentUser, AdminUser, Transaction } from '../../types';

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getAllUsers(),
  });
};

export const useUserById = (id: string) => {
  return useQuery<User, Error>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
};

export const useStudents = () => {
  return useQuery<StudentUser[], Error>({
    queryKey: queryKeys.users.students,
    queryFn: () => userService.getStudents(),
  });
};

export const useAdmins = () => {
  return useQuery<AdminUser[], Error>({
    queryKey: queryKeys.users.admins,
    queryFn: () => userService.getAdmins(),
  });
};

export const useUserTransactions = (userId: string) => {
  return useQuery<Transaction[], Error>({
    queryKey: queryKeys.users.transactions(userId),
    queryFn: () => userService.getStudentTransactions(userId),
    enabled: !!userId,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) => {
      return userService.createUser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) => {
      return userService.updateUser(id, userData);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(updatedUser.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return userService.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useBuyDrink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, drinkId, userPin }: {
      userId: string;
      drinkId: string;
      userPin?: string;
    }) => {
      return userService.buyDrink(userId, drinkId, userPin);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.transactions(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useCheckPin = () => {
  return useMutation({
    mutationFn: ({ userId, pin }: { userId: string; pin: string }) => {
      return userService.checkUserPin(userId, pin);
    },
  });
};

export const useUpdatePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      oldPin,
      newPin,
    }: {
      userId: string;
      oldPin: string;
      newPin: string;
    }) => {
      return userService.updateUserPin(userId, oldPin, newPin);
    },
    onSuccess: (isSuccess, variables) => {
      if (isSuccess) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      }
    },
  });
};
