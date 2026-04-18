import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useRoles() {
  const { storeCode } = useAuth();
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!storeCode) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('store_settings')
      .select('custom_roles')
      .eq('store_code', storeCode)
      .maybeSingle()
      .then(({ data }: { data: { custom_roles: string[] } | null }) => {
        setCustomRoles(data?.custom_roles ?? []);
      });
  }, [storeCode]);

  const persist = useCallback(async (roles: string[]) => {
    if (!storeCode) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('store_settings')
      .upsert({ store_code: storeCode, custom_roles: roles, updated_at: new Date().toISOString() });
  }, [storeCode]);

  const addRole = useCallback((role: string) => {
    const trimmed = role.trim();
    if (!trimmed || customRoles.includes(trimmed)) return;
    const updated = [...customRoles, trimmed];
    setCustomRoles(updated);
    persist(updated);
  }, [customRoles, persist]);

  const removeRole = useCallback((role: string) => {
    const updated = customRoles.filter(r => r !== role);
    setCustomRoles(updated);
    persist(updated);
  }, [customRoles, persist]);

  const renameRole = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = customRoles.map(r => r === oldName ? trimmed : r);
    setCustomRoles(updated);
    persist(updated);
  }, [customRoles, persist]);

  return { allRoles: customRoles, defaultRoles: [] as string[], customRoles, addRole, removeRole, renameRole };
}
