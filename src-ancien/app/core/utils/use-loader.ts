import { signal } from '@angular/core';

export interface Loader {
  readonly loading: ReturnType<typeof signal<boolean>>;
  readonly error: ReturnType<typeof signal<string | null>>;
  run(fn: () => Promise<void>): Promise<void>;
}

export function useLoader(initialLoading = true): Loader {
  const loading = signal(initialLoading);
  const error = signal<string | null>(null);

  return {
    loading,
    error,
    async run(fn: () => Promise<void>): Promise<void> {
      loading.set(true);
      error.set(null);
      try {
        await fn();
      } catch (err) {
        error.set(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        loading.set(false);
      }
    },
  };
}
