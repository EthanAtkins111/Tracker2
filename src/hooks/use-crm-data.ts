import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Account, Contact, Interaction, FollowUp } from '@/lib/types';
import * as store from '@/lib/supabase-store';

export function useCrmData() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [a, c, f] = await Promise.all([
        store.fetchAccounts(),
        store.fetchContacts(),
        store.fetchFollowUps(),
      ]);
      setAccounts(a);
      setContacts(c);
      setFollowUps(f);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Seed on first login then load
      store.seedRegionData().then(refresh).catch(() => refresh());
    }
  }, [user, refresh]);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountCity = (id: string) => accounts.find(a => a.id === id)?.city || '';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';
  const getContactName = (id: string) => contacts.find(c => c.id === id)?.name || '';

  return {
    accounts, contacts, followUps, loading, refresh,
    getAccountName, getAccountCity, getAccountPriority, getContactName,
  };
}

export function useAccountDetail(id: string | undefined) {
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [a, c, i, f] = await Promise.all([
        store.fetchAccount(id),
        store.fetchContactsByAccount(id),
        store.fetchInteractionsByAccount(id),
        store.fetchFollowUpsByAccount(id),
      ]);
      setAccount(a);
      setContacts(c);
      setInteractions(i);
      setFollowUps(f);
    } catch (err) {
      console.error('Failed to load account detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { account, contacts, interactions, followUps, loading, refresh };
}
