import { supabase } from '@/integrations/supabase/client';
import { Account, Contact, Interaction, FollowUp, AccountType, PriorityTier, RelationshipStrength, InteractionType, FollowUpStatus } from './types';

// Helper to get current user's store id
async function getStoreId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data } = await supabase
    .from('store_members')
    .select('store_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  if (!data) throw new Error('No store membership found');
  return data.store_id as string;
}

// ===== ACCOUNTS =====
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('accounts').select('*').order('name');
  if (error) throw error;
  return (data || []).map(mapAccount);
}

export async function fetchAccount(id: string): Promise<Account | null> {
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).single();
  if (error) return null;
  return mapAccount(data);
}

export async function createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('accounts').insert({
    user_id: userId,
    name: account.name,
    address: account.address,
    city: account.city,
    account_type: account.accountType,
    bed_count: account.bedCount,
    ownership: account.ownership,
    organization: account.organization,
    priority_tier: account.priorityTier,
    adp_volume: account.adpVolume,
    relationship_strength: account.relationshipStrength,
    notes: account.notes,
    tags: account.tags,
  }).select().single();
  if (error) throw error;
  return mapAccount(data);
}

export async function editAccount(id: string, updates: Partial<Account>): Promise<Account> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.accountType !== undefined) payload.account_type = updates.accountType;
  if (updates.bedCount !== undefined) payload.bed_count = updates.bedCount;
  if (updates.ownership !== undefined) payload.ownership = updates.ownership;
  if (updates.organization !== undefined) payload.organization = updates.organization;
  if (updates.priorityTier !== undefined) payload.priority_tier = updates.priorityTier;
  if (updates.adpVolume !== undefined) payload.adp_volume = updates.adpVolume;
  if (updates.relationshipStrength !== undefined) payload.relationship_strength = updates.relationshipStrength;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.tags !== undefined) payload.tags = updates.tags;

  const { data, error } = await supabase.from('accounts').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapAccount(data);
}

export async function removeAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    city: row.city as string,
    accountType: row.account_type as AccountType,
    bedCount: row.bed_count as number,
    ownership: row.ownership as string,
    organization: row.organization as string,
    priorityTier: row.priority_tier as PriorityTier,
    adpVolume: row.adp_volume as number,
    relationshipStrength: row.relationship_strength as RelationshipStrength,
    notes: row.notes as string,
    tags: (row.tags as string[]) || [],
    createdAt: row.created_at as string,
  };
}

// ===== CONTACTS =====
export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase.from('contacts').select('*').order('name');
  if (error) throw error;
  return (data || []).map(mapContact);
}

export async function fetchContactsByAccount(accountId: string): Promise<Contact[]> {
  const { data, error } = await supabase.from('contacts').select('*').eq('account_id', accountId).order('name');
  if (error) throw error;
  return (data || []).map(mapContact);
}

export async function fetchContact(id: string): Promise<Contact | null> {
  const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
  if (error) return null;
  return mapContact(data);
}

export async function createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('contacts').insert({
    user_id: userId,
    account_id: contact.accountId,
    name: contact.name,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    notes: contact.notes,
  }).select().single();
  if (error) throw error;
  return mapContact(data);
}

export async function editContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.accountId !== undefined) payload.account_id = updates.accountId;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data, error } = await supabase.from('contacts').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapContact(data);
}

export async function removeContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    name: row.name as string,
    role: row.role as string,
    phone: row.phone as string,
    email: row.email as string,
    notes: row.notes as string,
  };
}

// ===== INTERACTIONS =====
export async function fetchInteractions(): Promise<Interaction[]> {
  const { data, error } = await supabase.from('interactions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInteraction);
}

export async function fetchInteractionsByAccount(accountId: string): Promise<Interaction[]> {
  const { data, error } = await supabase.from('interactions').select('*').eq('account_id', accountId).order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInteraction);
}

export async function fetchLastInteraction(accountId: string): Promise<Interaction | null> {
  const { data, error } = await supabase.from('interactions').select('*').eq('account_id', accountId).order('date', { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return data ? mapInteraction(data) : null;
}

export async function createInteraction(interaction: Omit<Interaction, 'id'>): Promise<Interaction> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('interactions').insert({
    user_id: userId,
    account_id: interaction.accountId,
    contact_id: interaction.contactId || null,
    date: interaction.date,
    type: interaction.type,
    notes: interaction.notes,
    outcome: interaction.outcome,
  }).select().single();
  if (error) throw error;
  return mapInteraction(data);
}

function mapInteraction(row: Record<string, unknown>): Interaction {
  return {
    id: row.id as string,
    date: row.date as string,
    accountId: row.account_id as string,
    contactId: (row.contact_id as string) || '',
    type: row.type as InteractionType,
    notes: row.notes as string,
    outcome: row.outcome as string,
  };
}

// ===== FOLLOW-UPS =====
export async function fetchFollowUps(): Promise<FollowUp[]> {
  const { data, error } = await supabase.from('follow_ups').select('*').order('due_date');
  if (error) throw error;
  return (data || []).map(mapFollowUp);
}

export async function fetchFollowUpsByAccount(accountId: string): Promise<FollowUp[]> {
  const { data, error } = await supabase.from('follow_ups').select('*').eq('account_id', accountId).order('due_date');
  if (error) throw error;
  return (data || []).map(mapFollowUp);
}

export async function createFollowUp(followUp: Omit<FollowUp, 'id'>): Promise<FollowUp> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('follow_ups').insert({
    user_id: userId,
    account_id: followUp.accountId,
    contact_id: followUp.contactId || null,
    due_date: followUp.dueDate,
    type: followUp.type,
    status: followUp.status,
    notes: followUp.notes,
  }).select().single();
  if (error) throw error;
  return mapFollowUp(data);
}

export async function editFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp> {
  const payload: Record<string, unknown> = {};
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.type !== undefined) payload.type = updates.type;

  const { data, error } = await supabase.from('follow_ups').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapFollowUp(data);
}

export async function removeFollowUp(id: string): Promise<void> {
  const { error } = await supabase.from('follow_ups').delete().eq('id', id);
  if (error) throw error;
}

function mapFollowUp(row: Record<string, unknown>): FollowUp {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    contactId: (row.contact_id as string) || '',
    dueDate: row.due_date as string,
    type: row.type as string,
    status: row.status as FollowUpStatus,
    notes: row.notes as string,
  };
}

// ===== SEED REGION DATA =====
export async function seedRegionData(): Promise<void> {
  // Check if user already has accounts
  const { count } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  if (count && count > 0) return;

  const userId = await getUserId();

  const accounts = [
    // LTC
    { name: 'Linhaven', address: '403 Ontario St', city: 'St. Catharines', account_type: 'LTC', bed_count: 248, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Largest home, top priority', tags: [] as string[] },
    { name: 'Gilmore Lodge', address: '60 King St', city: 'Fort Erie', account_type: 'LTC', bed_count: 160, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Strong municipal influence', tags: [] as string[] },
    { name: 'Northland Pointe', address: '2 Fielden Ave', city: 'Fort Erie', account_type: 'LTC', bed_count: 160, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Newer build', tags: [] as string[] },
    { name: 'The Woodlands of Sunset', address: '670 Tanguay Ave', city: 'Welland', account_type: 'LTC', bed_count: 128, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'High', adp_volume: 30, relationship_strength: 'New', notes: 'Consistent purchasing', tags: [] as string[] },
    { name: 'D H Rapelje Lodge', address: '277 Plymouth Rd', city: 'Welland', account_type: 'LTC', bed_count: 160, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Rehab + LTC mix', tags: [] as string[] },
    { name: 'Niagara Ina Grafton Gage Village', address: '413 Linwell Rd', city: 'St. Catharines', account_type: 'LTC', bed_count: 220, ownership: 'Not-for-profit', organization: 'NIGGV', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Large campus', tags: [] as string[] },
    { name: 'Radiant Care Tabor Manor', address: '1 Tabor Dr', city: 'St. Catharines', account_type: 'LTC', bed_count: 128, ownership: 'Not-for-profit', organization: 'Radiant Care', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Network leverage', tags: [] as string[] },
    { name: 'Radiant Care Pleasant Manor', address: '1200 Line 3 Rd', city: 'NOTL', account_type: 'LTC', bed_count: 128, ownership: 'Not-for-profit', organization: 'Radiant Care', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Redevelopment', tags: [] as string[] },
    { name: 'Heidehof Long Term Care Home', address: '600 Lake St', city: 'St. Catharines', account_type: 'LTC', bed_count: 128, ownership: 'Not-for-profit', organization: 'Heidehof', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Relationship-driven', tags: [] as string[] },
    { name: 'Albright Manor', address: '5050 Hillside Dr', city: 'Beamsville', account_type: 'LTC', bed_count: 128, ownership: 'Not-for-profit', organization: 'Albright', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Engaged team', tags: [] as string[] },
    { name: 'Shalom Manor & Gardens', address: '12 Bartlett Ave', city: 'Grimsby', account_type: 'LTC', bed_count: 144, ownership: 'Not-for-profit', organization: 'Shalom Manor', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Faith-based', tags: [] as string[] },
    { name: 'Extendicare St. Catharines', address: '283 Pelham Rd', city: 'St. Catharines', account_type: 'LTC', bed_count: 120, ownership: 'Private', organization: 'Extendicare', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Corporate', tags: [] as string[] },
    { name: 'Westhills Care Centre', address: '355 Pelham Rd', city: 'St. Catharines', account_type: 'LTC', bed_count: 200, ownership: 'Private', organization: 'Sienna', priority_tier: 'Low', adp_volume: 80, relationship_strength: 'New', notes: 'Large volume', tags: [] as string[] },
    { name: 'Garden City Manor', address: '168 Scott St', city: 'St. Catharines', account_type: 'LTC', bed_count: 200, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 80, relationship_strength: 'New', notes: 'High occupancy', tags: [] as string[] },
    { name: 'Henley House', address: '64 Main St', city: 'St. Catharines', account_type: 'LTC', bed_count: 184, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Stable', tags: [] as string[] },
    { name: 'Valley Park Lodge', address: '2401 Whirlpool St', city: 'Niagara Falls', account_type: 'LTC', bed_count: 128, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Older facility', tags: [] as string[] },
    { name: 'Bella Senior Care Residence', address: '8720 Willoughby Dr', city: 'Niagara Falls', account_type: 'LTC', bed_count: 160, ownership: 'Private', organization: 'Southbridge', priority_tier: 'Low', adp_volume: 80, relationship_strength: 'New', notes: 'Linked site', tags: [] as string[] },
    { name: 'Chippawa Creek Care Centre', address: '8000 McLeod Rd', city: 'Niagara Falls', account_type: 'LTC', bed_count: 160, ownership: 'Private', organization: 'Southbridge', priority_tier: 'Low', adp_volume: 80, relationship_strength: 'New', notes: 'Sister home', tags: [] as string[] },
    { name: 'Oakwood Park Lodge', address: '5100 Dorchester Rd', city: 'Niagara Falls', account_type: 'LTC', bed_count: 160, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Standard LTC', tags: [] as string[] },
    { name: 'Royal Rose Place', address: '635 Prince Charles Dr', city: 'St. Catharines', account_type: 'LTC', bed_count: 160, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Mid-size', tags: [] as string[] },
    { name: 'Millennium Trail Manor', address: '3100 Dorchester Rd', city: 'Niagara Falls', account_type: 'LTC', bed_count: 160, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Growing', tags: [] as string[] },
    { name: 'Meadows of Dorchester', address: '2750 Dorchester Rd', city: 'Niagara Falls', account_type: 'LTC', bed_count: 100, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Smaller', tags: [] as string[] },
    { name: 'Foyer Richelieu', address: '655 Tanguay Ave', city: 'Welland', account_type: 'LTC', bed_count: 128, ownership: 'Not-for-profit', organization: 'Francophone', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'French population', tags: [] as string[] },
    { name: 'West Park Health Centre', address: '82 West St', city: 'St. Catharines', account_type: 'LTC', bed_count: 69, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Small', tags: [] as string[] },
    { name: 'Crescent Park Lodge', address: '2574 Thunder Bay Rd', city: 'Fort Erie', account_type: 'LTC', bed_count: 68, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Small', tags: [] as string[] },
    { name: 'R H Lawson Eventide Home', address: '265 Four Mile Creek Rd', city: 'NOTL', account_type: 'LTC', bed_count: 70, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Small municipal', tags: [] as string[] },
    { name: 'Deer Park Villa', address: '150 Central Ave', city: 'Grimsby', account_type: 'LTC', bed_count: 40, ownership: 'Municipal', organization: 'Niagara Region', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Easy access', tags: [] as string[] },
    { name: 'Kilean Lodge Long-Term Care Home', address: '83 Main St E', city: 'Grimsby', account_type: 'LTC', bed_count: 50, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Quick wins', tags: [] as string[] },
    { name: 'Niagara Health Welland ECU', address: '65 Third St', city: 'Welland', account_type: 'LTC', bed_count: 75, ownership: 'Hospital', organization: 'Niagara Health', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'ECU unit', tags: [] as string[] },
    // Retirement
    { name: "Angel's Retirement Home", address: '417 Queenston St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Small home, close to downtown', tags: [] as string[] },
    { name: 'Aspira Heatherwood Retirement Living', address: '113 Scott St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Aspira', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Part of Aspira portfolio', tags: [] as string[] },
    { name: 'Aspira Lincoln Park Retirement Living', address: '265 Main St E', city: 'Grimsby', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Aspira', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Grimsby market', tags: [] as string[] },
    { name: 'Cobblestone Gardens Retirement Residence', address: '10 Ormond St N', city: 'Thorold', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Sits in Thorold area', tags: [] as string[] },
    { name: 'Elgin Falls Retirement Community', address: '7070 Montrose Rd', city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Falls neighbourhood', tags: [] as string[] },
    { name: 'Emerald Retirement Residence', address: '5807 Ferry St', city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Large residence', tags: [] as string[] },
    { name: 'Garrison Place', address: '373 Garrison Rd', city: 'Fort Erie', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Fort Erie location', tags: [] as string[] },
    { name: 'Grand Canal Retirement Residence', address: '439 King St', city: 'Welland', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Welland community', tags: [] as string[] },
    { name: 'The Jacob Senior Living', address: '5082 Alyssa Dr', city: 'Beamsville', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Beamsville region', tags: [] as string[] },
    { name: 'Jah-Jireh Seniors Ministry Association', address: '4505 Thirty Rd', city: 'Beamsville', account_type: 'Retirement', bed_count: 0, ownership: 'Private/Ministry', organization: 'Jah-Jireh', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Faith-based service', tags: [] as string[] },
    { name: 'Loyalist Retirement Residence', address: '190 King St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Very central', tags: [] as string[] },
    { name: 'Lundy Manor', address: "7860 Lundy's Lane", city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Falls traffic hub', tags: [] as string[] },
    { name: 'Maplecrest', address: '85 Main St E', city: 'Grimsby', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Grimsby small community', tags: [] as string[] },
    { name: 'Mount Carmel Home', address: '78 Yates St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Historic property', tags: [] as string[] },
    { name: 'Pioneer Elder Care – Lakeshore Rd', address: '180A Lakeshore Rd', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Pioneer', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Cluster in St. Catharines', tags: [] as string[] },
    { name: 'Pioneer Elder Care – St Helena St', address: '29 St Helena St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Pioneer', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Multiple Pioneer sites', tags: [] as string[] },
    { name: 'Pioneer Elder Care – Vine St', address: '473 Vine St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Pioneer', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Multiple Pioneer sites', tags: [] as string[] },
    { name: 'Plymouth Cordage Retirement Residence', address: '110 First St', city: 'Welland', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Welland area', tags: [] as string[] },
    { name: 'Portal Village Retirement Community', address: '300 Elgin St', city: 'Port Colborne', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Spring Living', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Port Colborne region', tags: [] as string[] },
    { name: 'Queenston Place Retirement Residence', address: '6440 Valley Way', city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Larger residence', tags: [] as string[] },
    { name: 'Redstacks Retirement Home', address: '303 Niagara Blvd', city: 'Fort Erie', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Fort Erie location', tags: [] as string[] },
    { name: "Residence on Lundy's Lane", address: "8158 Lundy's Lane", city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Large traffic area', tags: [] as string[] },
    { name: 'River Road Retirement Residence', address: '4067 River Rd', city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Assisted living focus', tags: [] as string[] },
    { name: 'Royal Henley Retirement Community', address: '582 Ontario St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Well-known community', tags: [] as string[] },
    { name: 'Seasons Retirement Community – Welland', address: '163 First Ave', city: 'Welland', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Seasons', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Modern build', tags: [] as string[] },
    { name: 'Seasons St. Catharines', address: '155 Ontario St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Seasons', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Central', tags: [] as string[] },
    { name: 'Shorthills Villa Retirement Community', address: '1532 Pelham St', city: 'Fonthill', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Fonthill area', tags: [] as string[] },
    { name: 'Spring Living – Lookout Ridge', address: '1505 Lookout St', city: 'Fonthill', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Spring Living', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Market segment', tags: [] as string[] },
    { name: 'St Charles Village Retirement Community', address: '30 Nova Cres', city: 'Welland', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Community option', tags: [] as string[] },
    { name: 'Tufford Manor Retirement Residence', address: '312 Queenston St', city: 'St. Catharines', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Well-established', tags: [] as string[] },
    { name: 'Villa De Rose Retirement Residence', address: '370 Hellems Ave', city: 'Welland', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Smaller residence', tags: [] as string[] },
    { name: 'Willoughby Manor Retirement Residence', address: '3584 Bridgewater St', city: 'Niagara Falls', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Falls area', tags: [] as string[] },
    { name: 'The Willows MyLife Retirement Living', address: '1485 Garrison Rd', city: 'Fort Erie', account_type: 'Retirement', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Fort Erie retirement option', tags: [] as string[] },
    // Group Homes
    { name: 'Bethesda Services', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Group Home', bed_count: 200, ownership: 'Not-for-profit', organization: 'Bethesda', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Large multi-home operator, 24/7 care', tags: [] as string[] },
    { name: 'Inclusion West Niagara', address: 'Multiple sites', city: 'Grimsby', account_type: 'Group Home', bed_count: 80, ownership: 'Not-for-profit', organization: 'IWN', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Key Grimsby target', tags: [] as string[] },
    { name: 'Community Living St. Catharines', address: 'Multiple sites', city: 'St. Catharines', account_type: 'Group Home', bed_count: 150, ownership: 'Not-for-profit', organization: 'Community Living', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Large network', tags: [] as string[] },
    { name: 'Community Living Welland Pelham', address: 'Multiple sites', city: 'Welland', account_type: 'Group Home', bed_count: 120, ownership: 'Not-for-profit', organization: 'Community Living', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Strong OT involvement', tags: [] as string[] },
    { name: 'Community Living Fort Erie', address: 'Multiple sites', city: 'Fort Erie', account_type: 'Group Home', bed_count: 80, ownership: 'Not-for-profit', organization: 'Community Living', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Smaller region', tags: [] as string[] },
    { name: 'Community Living Port Colborne-Wainfleet', address: 'Multiple sites', city: 'Port Colborne', account_type: 'Group Home', bed_count: 70, ownership: 'Not-for-profit', organization: 'Community Living', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Spread-out homes', tags: [] as string[] },
    { name: 'Gateway Residential & Community Support Services', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Group Home', bed_count: 150, ownership: 'Not-for-profit', organization: 'Gateway', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Mental health housing', tags: [] as string[] },
    { name: 'Grundy House', address: '227 Queenston St', city: 'St. Catharines', account_type: 'Group Home', bed_count: 12, ownership: 'Not-for-profit', organization: 'Gateway', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Mental health residence', tags: [] as string[] },
    { name: 'Berard House', address: 'Niagara Falls', city: 'Niagara Falls', account_type: 'Group Home', bed_count: 12, ownership: 'Not-for-profit', organization: 'Gateway', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Mental health', tags: [] as string[] },
    { name: 'Canal View Homes', address: 'Welland', city: 'Welland', account_type: 'Group Home', bed_count: 15, ownership: 'Not-for-profit', organization: 'Gateway', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Cluster homes', tags: [] as string[] },
    { name: 'ARID Recovery Homes Niagara', address: 'Multiple sites', city: 'Welland', account_type: 'Group Home', bed_count: 40, ownership: 'Not-for-profit', organization: 'ARID', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Short-term recovery', tags: [] as string[] },
    { name: 'Bethlehem Housing and Support Services', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Group Home', bed_count: 100, ownership: 'Not-for-profit', organization: 'Bethlehem', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Transitional housing', tags: [] as string[] },
    { name: 'Nest Niagara', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Group Home', bed_count: 50, ownership: 'Not-for-profit', organization: 'Nest', priority_tier: 'Low', adp_volume: 30, relationship_strength: 'New', notes: 'Aging-in-place', tags: [] as string[] },
    { name: 'Niagara Peninsula Homes', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Group Home', bed_count: 1800, ownership: 'Municipal/Non-profit', organization: 'NPH', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Indirect influence', tags: [] as string[] },
    // Hospitals
    { name: 'Niagara Falls Hospital', address: '5546 Portage Rd', city: 'Niagara Falls', account_type: 'Hospital', bed_count: 225, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Stroke, rehab, discharge pipeline', tags: [] as string[] },
    { name: 'Marotta Family Hospital', address: '1200 Fourth Ave', city: 'St. Catharines', account_type: 'Hospital', bed_count: 475, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Largest acute site, high OT volume', tags: [] as string[] },
    { name: 'Welland Hospital', address: '65 Third St', city: 'Welland', account_type: 'Hospital', bed_count: 88, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Transitional + redevelopment', tags: [] as string[] },
    { name: 'Port Colborne Urgent Care Centre', address: '260 Sugarloaf St', city: 'Port Colborne', account_type: 'Hospital', bed_count: 25, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Limited inpatient', tags: [] as string[] },
    { name: 'Fort Erie Urgent Care Centre', address: '1485 Garrison Rd', city: 'Fort Erie', account_type: 'Hospital', bed_count: 25, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'Low', adp_volume: 10, relationship_strength: 'New', notes: 'Community access point', tags: [] as string[] },
    { name: 'West Lincoln Memorial Hospital', address: '169 Main St E', city: 'Grimsby', account_type: 'Hospital', bed_count: 70, ownership: 'Public', organization: 'Hamilton Health Sciences', priority_tier: 'High', adp_volume: 30, relationship_strength: 'New', notes: 'Key Grimsby site', tags: [] as string[] },
    // Clinics
    { name: 'Niagara Health – Outpatient Rehab', address: '1200 Fourth Ave', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Direct OT/PT referral pipeline', tags: [] as string[] },
    { name: 'Niagara Falls Hospital Rehab Services', address: '5546 Portage Rd', city: 'Niagara Falls', account_type: 'Clinic', bed_count: 0, ownership: 'Public', organization: 'Niagara Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Stroke + mobility cases', tags: [] as string[] },
    { name: 'Hotel Dieu Shaver Health and Rehabilitation Centre', address: '541 Glenridge Ave', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Not-for-profit', organization: 'Hotel Dieu Shaver', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'HUGE rehab + wheelchair referrals', tags: [] as string[] },
    { name: 'CBI Health St. Catharines', address: 'Multiple sites', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'CBI Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'OT + PT + ADP', tags: [] as string[] },
    { name: 'CBI Health Niagara Falls', address: 'Multiple sites', city: 'Niagara Falls', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'CBI Health', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Strong referral source', tags: [] as string[] },
    { name: 'Lifemark Physiotherapy St. Catharines', address: 'Multiple sites', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Lifemark', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Large national chain', tags: [] as string[] },
    { name: 'Lifemark Physiotherapy Welland', address: 'Multiple sites', city: 'Welland', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Lifemark', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Rehab focus', tags: [] as string[] },
    { name: 'Lifemark Physiotherapy Grimsby', address: 'Multiple sites', city: 'Grimsby', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Lifemark', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'West Niagara coverage', tags: [] as string[] },
    { name: 'Niagara Orthopaedic Institute', address: '34 Scott St', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Post-surgical mobility', tags: [] as string[] },
    { name: 'Niagara Physiotherapy & Sports Clinic', address: 'Niagara Falls', city: 'Niagara Falls', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Local clinic', tags: [] as string[] },
    { name: 'Falls Physiotherapy', address: 'Niagara Falls', city: 'Niagara Falls', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Falls area', tags: [] as string[] },
    { name: 'Pelham Physiotherapy', address: 'Fonthill', city: 'Pelham', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Private', priority_tier: 'Medium', adp_volume: 30, relationship_strength: 'New', notes: 'Fonthill coverage', tags: [] as string[] },
    { name: "Niagara Children's Centre", address: '567 Glenridge Ave', city: 'St. Catharines', account_type: 'Clinic', bed_count: 0, ownership: 'Not-for-profit', organization: "Niagara Children's Centre", priority_tier: 'High', adp_volume: 30, relationship_strength: 'New', notes: 'Pediatric mobility equipment', tags: [] as string[] },
    { name: 'March of Dimes Canada – Niagara', address: 'Multiple sites', city: 'Niagara Region', account_type: 'Clinic', bed_count: 0, ownership: 'Not-for-profit', organization: 'March of Dimes', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Strong ADP involvement', tags: [] as string[] },
    { name: 'Closing the Gap Healthcare', address: 'Mobile', city: 'Niagara Region', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'Closing the Gap', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'In-home OT = huge referrals', tags: [] as string[] },
    { name: 'CarePartners Rehabilitation', address: 'Mobile', city: 'Niagara Region', account_type: 'Clinic', bed_count: 0, ownership: 'Private', organization: 'CarePartners', priority_tier: 'High', adp_volume: 80, relationship_strength: 'New', notes: 'Home-based ADP pipeline', tags: [] as string[] },
  ];

  // Insert in batches of 20
  for (let i = 0; i < accounts.length; i += 20) {
    const batch = accounts.slice(i, i + 20).map(a => ({ ...a, user_id: userId }));
    const { error } = await supabase.from('accounts').insert(batch);
    if (error) throw error;
  }
}
