import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerMatch } from '../api/registration';

export function useRegisterMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: registerMatch,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['ranking'] }),
        client.invalidateQueries({ queryKey: ['match-history'] }),
      ]);
    },
  });
}
