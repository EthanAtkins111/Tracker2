import { useState, useCallback } from 'react';

// Simple hook to force re-render when store data changes
export function useStoreRefresh() {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  return refresh;
}
