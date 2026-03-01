import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/userService';
import { UpdateProfileRequest, UserProfile } from '@sunsteel/contracts';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser);
    },
  });
}
