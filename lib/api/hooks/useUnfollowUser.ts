import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PublicUserProfile } from '@sunsteel/contracts';
import { userService } from '@/lib/api/services/userService';

export function useUnfollowUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<PublicUserProfile, Error>({
    mutationFn: () => userService.unfollowUser(userId),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['users', 'public', userId], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
