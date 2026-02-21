import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { UpdateProfileRequest } from '@sunsteel/contracts';
import { User } from '@/lib/api/types/auth.type';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser);
    },
  });
}
