import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerMatch } from '../api/registration';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRegistrationQueue } from '../api/registrationQueue';

export function useRegisterMatch() {
  const client = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: registerMatch,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['ranking'] }),
        client.invalidateQueries({ queryKey: ['match-history'] }),
      ]);
    },
  });
  const [queue] = useState(() => createRegistrationQueue(mutateAsync));
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot);

  useEffect(() => {
    void queue.retryAll();
  }, [queue]);

  return { ...snapshot, submit: queue.submit, retryAll: queue.retryAll };
}
