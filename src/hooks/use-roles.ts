import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "crm-custom-roles";
const DEFAULT_ROLES = ['OT', 'PT', 'Nurse Manager', 'Director of Care', 'General Manager', 'Physician', 'Physiatrist', 'Administrator', 'Other'];

function loadCustomRoles(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomRoles(roles: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

export function useRoles() {
  const [customRoles, setCustomRoles] = useState<string[]>(loadCustomRoles);

  const allRoles = [...DEFAULT_ROLES.filter(r => r !== 'Other'), ...customRoles, 'Other'];

  const addRole = useCallback((role: string) => {
    const trimmed = role.trim();
    if (!trimmed || DEFAULT_ROLES.includes(trimmed) || customRoles.includes(trimmed)) return;
    const updated = [...customRoles, trimmed];
    setCustomRoles(updated);
    saveCustomRoles(updated);
  }, [customRoles]);

  const removeRole = useCallback((role: string) => {
    if (DEFAULT_ROLES.includes(role)) return; // can't remove defaults
    const updated = customRoles.filter(r => r !== role);
    setCustomRoles(updated);
    saveCustomRoles(updated);
  }, [customRoles]);

  const renameRole = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || DEFAULT_ROLES.includes(oldName)) return;
    const updated = customRoles.map(r => r === oldName ? trimmed : r);
    setCustomRoles(updated);
    saveCustomRoles(updated);
  }, [customRoles]);

  return { allRoles, defaultRoles: DEFAULT_ROLES, customRoles, addRole, removeRole, renameRole };
}
