import { Account, Contact, Interaction, FollowUp } from './types';

const STORAGE_KEYS = {
  accounts: 'crm_accounts',
  contacts: 'crm_contacts',
  interactions: 'crm_interactions',
  followUps: 'crm_followups',
};

function generateId(): string {
  return crypto.randomUUID();
}

function load<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Accounts
export function getAccounts(): Account[] { return load<Account>(STORAGE_KEYS.accounts); }
export function getAccount(id: string): Account | undefined { return getAccounts().find(a => a.id === id); }
export function saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
  const accounts = getAccounts();
  const newAccount: Account = { ...account, id: generateId(), createdAt: new Date().toISOString() };
  accounts.push(newAccount);
  save(STORAGE_KEYS.accounts, accounts);
  return newAccount;
}
export function updateAccount(id: string, updates: Partial<Account>): Account | undefined {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) return undefined;
  accounts[idx] = { ...accounts[idx], ...updates };
  save(STORAGE_KEYS.accounts, accounts);
  return accounts[idx];
}
export function deleteAccount(id: string) {
  save(STORAGE_KEYS.accounts, getAccounts().filter(a => a.id !== id));
  save(STORAGE_KEYS.contacts, getContacts().filter(c => c.accountId !== id));
  save(STORAGE_KEYS.interactions, getInteractions().filter(i => i.accountId !== id));
  save(STORAGE_KEYS.followUps, getFollowUps().filter(f => f.accountId !== id));
}

// Contacts
export function getContacts(): Contact[] { return load<Contact>(STORAGE_KEYS.contacts); }
export function getContactsByAccount(accountId: string): Contact[] { return getContacts().filter(c => c.accountId === accountId); }
export function getContact(id: string): Contact | undefined { return getContacts().find(c => c.id === id); }
export function saveContact(contact: Omit<Contact, 'id'>): Contact {
  const contacts = getContacts();
  const newContact: Contact = { ...contact, id: generateId() };
  contacts.push(newContact);
  save(STORAGE_KEYS.contacts, contacts);
  return newContact;
}
export function updateContact(id: string, updates: Partial<Contact>): Contact | undefined {
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  contacts[idx] = { ...contacts[idx], ...updates };
  save(STORAGE_KEYS.contacts, contacts);
  return contacts[idx];
}
export function deleteContact(id: string) {
  save(STORAGE_KEYS.contacts, getContacts().filter(c => c.id !== id));
}

// Interactions
export function getInteractions(): Interaction[] { return load<Interaction>(STORAGE_KEYS.interactions); }
export function getInteractionsByAccount(accountId: string): Interaction[] {
  return getInteractions().filter(i => i.accountId === accountId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function getLastInteraction(accountId: string): Interaction | undefined {
  return getInteractionsByAccount(accountId)[0];
}
export function saveInteraction(interaction: Omit<Interaction, 'id'>): Interaction {
  const interactions = getInteractions();
  const newInteraction: Interaction = { ...interaction, id: generateId() };
  interactions.push(newInteraction);
  save(STORAGE_KEYS.interactions, interactions);
  return newInteraction;
}

// Follow-ups
export function getFollowUps(): FollowUp[] { return load<FollowUp>(STORAGE_KEYS.followUps); }
export function getFollowUpsByAccount(accountId: string): FollowUp[] {
  return getFollowUps().filter(f => f.accountId === accountId).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
export function saveFollowUp(followUp: Omit<FollowUp, 'id'>): FollowUp {
  const followUps = getFollowUps();
  const newFollowUp: FollowUp = { ...followUp, id: generateId() };
  followUps.push(newFollowUp);
  save(STORAGE_KEYS.followUps, followUps);
  return newFollowUp;
}
export function updateFollowUp(id: string, updates: Partial<FollowUp>): FollowUp | undefined {
  const followUps = getFollowUps();
  const idx = followUps.findIndex(f => f.id === id);
  if (idx === -1) return undefined;
  followUps[idx] = { ...followUps[idx], ...updates };
  save(STORAGE_KEYS.followUps, followUps);
  return followUps[idx];
}
export function deleteFollowUp(id: string) {
  save(STORAGE_KEYS.followUps, getFollowUps().filter(f => f.id !== id));
}

// Reset and re-seed
export function resetAndSeed() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  seedData();
}

// Seed data from REGION_DATA.xlsx
export function seedData() {
  if (getAccounts().length > 0) return;

  const accounts: Omit<Account, 'id' | 'createdAt'>[] = [
    // ===== PAGE 1: LONG TERM CARE =====
    { name: 'Linhaven', address: '403 Ontario St', city: 'St. Catharines', accountType: 'LTC', bedCount: 248, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Largest home, top priority', tags: [] },
    { name: 'Gilmore Lodge', address: '60 King St', city: 'Fort Erie', accountType: 'LTC', bedCount: 160, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Strong municipal influence', tags: [] },
    { name: 'Northland Pointe', address: '2 Fielden Ave', city: 'Fort Erie', accountType: 'LTC', bedCount: 160, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Newer build', tags: [] },
    { name: 'The Woodlands of Sunset', address: '670 Tanguay Ave', city: 'Welland', accountType: 'LTC', bedCount: 128, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'High', adpVolume: 30, relationshipStrength: 'New', notes: 'Consistent purchasing', tags: [] },
    { name: 'D H Rapelje Lodge', address: '277 Plymouth Rd', city: 'Welland', accountType: 'LTC', bedCount: 160, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Rehab + LTC mix', tags: [] },
    { name: 'Niagara Ina Grafton Gage Village', address: '413 Linwell Rd', city: 'St. Catharines', accountType: 'LTC', bedCount: 220, ownership: 'Not-for-profit', organization: 'NIGGV', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Large campus', tags: [] },
    { name: 'Radiant Care Tabor Manor', address: '1 Tabor Dr', city: 'St. Catharines', accountType: 'LTC', bedCount: 128, ownership: 'Not-for-profit', organization: 'Radiant Care', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Network leverage', tags: [] },
    { name: 'Radiant Care Pleasant Manor', address: '1200 Line 3 Rd', city: 'NOTL', accountType: 'LTC', bedCount: 128, ownership: 'Not-for-profit', organization: 'Radiant Care', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Redevelopment', tags: [] },
    { name: 'Heidehof Long Term Care Home', address: '600 Lake St', city: 'St. Catharines', accountType: 'LTC', bedCount: 128, ownership: 'Not-for-profit', organization: 'Heidehof', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Relationship-driven', tags: [] },
    { name: 'Albright Manor', address: '5050 Hillside Dr', city: 'Beamsville', accountType: 'LTC', bedCount: 128, ownership: 'Not-for-profit', organization: 'Albright', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Engaged team', tags: [] },
    { name: 'Shalom Manor & Gardens', address: '12 Bartlett Ave', city: 'Grimsby', accountType: 'LTC', bedCount: 144, ownership: 'Not-for-profit', organization: 'Shalom Manor', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Faith-based', tags: [] },
    { name: 'Extendicare St. Catharines', address: '283 Pelham Rd', city: 'St. Catharines', accountType: 'LTC', bedCount: 120, ownership: 'Private', organization: 'Extendicare', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Corporate', tags: [] },
    { name: 'Westhills Care Centre', address: '355 Pelham Rd', city: 'St. Catharines', accountType: 'LTC', bedCount: 200, ownership: 'Private', organization: 'Sienna', priorityTier: 'Low', adpVolume: 80, relationshipStrength: 'New', notes: 'Large volume', tags: [] },
    { name: 'Garden City Manor', address: '168 Scott St', city: 'St. Catharines', accountType: 'LTC', bedCount: 200, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 80, relationshipStrength: 'New', notes: 'High occupancy', tags: [] },
    { name: 'Henley House', address: '64 Main St', city: 'St. Catharines', accountType: 'LTC', bedCount: 184, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Stable', tags: [] },
    { name: 'Valley Park Lodge', address: '2401 Whirlpool St', city: 'Niagara Falls', accountType: 'LTC', bedCount: 128, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Older facility', tags: [] },
    { name: 'Bella Senior Care Residence', address: '8720 Willoughby Dr', city: 'Niagara Falls', accountType: 'LTC', bedCount: 160, ownership: 'Private', organization: 'Southbridge', priorityTier: 'Low', adpVolume: 80, relationshipStrength: 'New', notes: 'Linked site', tags: [] },
    { name: 'Chippawa Creek Care Centre', address: '8000 McLeod Rd', city: 'Niagara Falls', accountType: 'LTC', bedCount: 160, ownership: 'Private', organization: 'Southbridge', priorityTier: 'Low', adpVolume: 80, relationshipStrength: 'New', notes: 'Sister home', tags: [] },
    { name: 'Oakwood Park Lodge', address: '5100 Dorchester Rd', city: 'Niagara Falls', accountType: 'LTC', bedCount: 160, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Standard LTC', tags: [] },
    { name: 'Royal Rose Place', address: '635 Prince Charles Dr', city: 'St. Catharines', accountType: 'LTC', bedCount: 160, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Mid-size', tags: [] },
    { name: 'Millennium Trail Manor', address: '3100 Dorchester Rd', city: 'Niagara Falls', accountType: 'LTC', bedCount: 160, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Growing', tags: [] },
    { name: 'Meadows of Dorchester', address: '2750 Dorchester Rd', city: 'Niagara Falls', accountType: 'LTC', bedCount: 100, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Smaller', tags: [] },
    { name: 'Foyer Richelieu', address: '655 Tanguay Ave', city: 'Welland', accountType: 'LTC', bedCount: 128, ownership: 'Not-for-profit', organization: 'Francophone', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'French population', tags: [] },
    { name: 'West Park Health Centre', address: '82 West St', city: 'St. Catharines', accountType: 'LTC', bedCount: 69, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Small', tags: [] },
    { name: 'Crescent Park Lodge', address: '2574 Thunder Bay Rd', city: 'Fort Erie', accountType: 'LTC', bedCount: 68, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Small', tags: [] },
    { name: 'R H Lawson Eventide Home', address: '265 Four Mile Creek Rd', city: 'NOTL', accountType: 'LTC', bedCount: 70, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Small municipal', tags: [] },
    { name: 'Deer Park Villa', address: '150 Central Ave', city: 'Grimsby', accountType: 'LTC', bedCount: 40, ownership: 'Municipal', organization: 'Niagara Region', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Easy access', tags: [] },
    { name: 'Kilean Lodge Long-Term Care Home', address: '83 Main St E', city: 'Grimsby', accountType: 'LTC', bedCount: 50, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Quick wins', tags: [] },
    { name: 'Niagara Health Welland ECU', address: '65 Third St', city: 'Welland', accountType: 'LTC', bedCount: 75, ownership: 'Hospital', organization: 'Niagara Health', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'ECU unit', tags: [] },

    // ===== PAGE 2: RETIREMENT HOMES =====
    { name: "Angel's Retirement Home", address: '417 Queenston St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Small home, close to downtown', tags: [] },
    { name: 'Aspira Heatherwood Retirement Living', address: '113 Scott St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Aspira', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Part of Aspira portfolio', tags: [] },
    { name: 'Aspira Lincoln Park Retirement Living', address: '265 Main St E', city: 'Grimsby', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Aspira', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Grimsby market', tags: [] },
    { name: 'Cobblestone Gardens Retirement Residence', address: '10 Ormond St N', city: 'Thorold', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Sits in Thorold area', tags: [] },
    { name: 'Elgin Falls Retirement Community', address: '7070 Montrose Rd', city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Falls neighbourhood', tags: [] },
    { name: 'Emerald Retirement Residence', address: '5807 Ferry St', city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Large residence', tags: [] },
    { name: 'Garrison Place', address: '373 Garrison Rd', city: 'Fort Erie', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Fort Erie location', tags: [] },
    { name: 'Grand Canal Retirement Residence', address: '439 King St', city: 'Welland', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Welland community', tags: [] },
    { name: 'The Jacob Senior Living', address: '5082 Alyssa Dr', city: 'Beamsville', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Beamsville region', tags: [] },
    { name: 'Jah-Jireh Seniors Ministry Association', address: '4505 Thirty Rd', city: 'Beamsville', accountType: 'Retirement', bedCount: 0, ownership: 'Private/Ministry', organization: 'Jah-Jireh', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Faith-based service', tags: [] },
    { name: 'Loyalist Retirement Residence', address: '190 King St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Very central', tags: [] },
    { name: 'Lundy Manor', address: "7860 Lundy's Lane", city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Falls traffic hub', tags: [] },
    { name: 'Maplecrest', address: '85 Main St E', city: 'Grimsby', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Grimsby small community', tags: [] },
    { name: 'Mount Carmel Home', address: '78 Yates St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Historic property', tags: [] },
    { name: 'Pioneer Elder Care – Lakeshore Rd', address: '180A Lakeshore Rd', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Pioneer', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Cluster in St. Catharines', tags: [] },
    { name: 'Pioneer Elder Care – St Helena St', address: '29 St Helena St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Pioneer', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Multiple Pioneer sites', tags: [] },
    { name: 'Pioneer Elder Care – Vine St', address: '473 Vine St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Pioneer', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Multiple Pioneer sites', tags: [] },
    { name: 'Plymouth Cordage Retirement Residence', address: '110 First St', city: 'Welland', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Welland area', tags: [] },
    { name: 'Portal Village Retirement Community', address: '300 Elgin St', city: 'Port Colborne', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Spring Living', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Port Colborne region', tags: [] },
    { name: 'Queenston Place Retirement Residence', address: '6440 Valley Way', city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Larger residence', tags: [] },
    { name: 'Redstacks Retirement Home', address: '303 Niagara Blvd', city: 'Fort Erie', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Fort Erie location', tags: [] },
    { name: "Residence on Lundy's Lane", address: "8158 Lundy's Lane", city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Large traffic area', tags: [] },
    { name: 'River Road Retirement Residence', address: '4067 River Rd', city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Assisted living focus', tags: [] },
    { name: 'Royal Henley Retirement Community', address: '582 Ontario St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Well-known community', tags: [] },
    { name: 'Seasons Retirement Community – Welland', address: '163 First Ave', city: 'Welland', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Seasons', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Modern build', tags: [] },
    { name: 'Seasons St. Catharines', address: '155 Ontario St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Seasons', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Central', tags: [] },
    { name: 'Shorthills Villa Retirement Community', address: '1532 Pelham St', city: 'Fonthill', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Fonthill area', tags: [] },
    { name: 'Spring Living – Lookout Ridge', address: '1505 Lookout St', city: 'Fonthill', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Spring Living', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Market segment', tags: [] },
    { name: 'St Charles Village Retirement Community', address: '30 Nova Cres', city: 'Welland', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Community option', tags: [] },
    { name: 'Tufford Manor Retirement Residence', address: '312 Queenston St', city: 'St. Catharines', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Well-established', tags: [] },
    { name: 'Villa De Rose Retirement Residence', address: '370 Hellems Ave', city: 'Welland', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Smaller residence', tags: [] },
    { name: 'Willoughby Manor Retirement Residence', address: '3584 Bridgewater St', city: 'Niagara Falls', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Falls area', tags: [] },
    { name: 'The Willows MyLife Retirement Living', address: '1485 Garrison Rd', city: 'Fort Erie', accountType: 'Retirement', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Fort Erie retirement option', tags: [] },

    // ===== PAGE 3: GROUP HOMES =====
    { name: 'Bethesda Services', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Group Home', bedCount: 200, ownership: 'Not-for-profit', organization: 'Bethesda', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Large multi-home operator, 24/7 care', tags: [] },
    { name: 'Inclusion West Niagara', address: 'Multiple sites', city: 'Grimsby', accountType: 'Group Home', bedCount: 80, ownership: 'Not-for-profit', organization: 'IWN', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Key Grimsby target', tags: [] },
    { name: 'Community Living St. Catharines', address: 'Multiple sites', city: 'St. Catharines', accountType: 'Group Home', bedCount: 150, ownership: 'Not-for-profit', organization: 'Community Living', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Large network', tags: [] },
    { name: 'Community Living Welland Pelham', address: 'Multiple sites', city: 'Welland', accountType: 'Group Home', bedCount: 120, ownership: 'Not-for-profit', organization: 'Community Living', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Strong OT involvement', tags: [] },
    { name: 'Community Living Fort Erie', address: 'Multiple sites', city: 'Fort Erie', accountType: 'Group Home', bedCount: 80, ownership: 'Not-for-profit', organization: 'Community Living', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Smaller region', tags: [] },
    { name: 'Community Living Port Colborne-Wainfleet', address: 'Multiple sites', city: 'Port Colborne', accountType: 'Group Home', bedCount: 70, ownership: 'Not-for-profit', organization: 'Community Living', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Spread-out homes', tags: [] },
    { name: 'Gateway Residential & Community Support Services', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Group Home', bedCount: 150, ownership: 'Not-for-profit', organization: 'Gateway', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Mental health housing', tags: [] },
    { name: 'Grundy House', address: '227 Queenston St', city: 'St. Catharines', accountType: 'Group Home', bedCount: 12, ownership: 'Not-for-profit', organization: 'Gateway', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Mental health residence', tags: [] },
    { name: 'Berard House', address: 'Niagara Falls', city: 'Niagara Falls', accountType: 'Group Home', bedCount: 12, ownership: 'Not-for-profit', organization: 'Gateway', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Mental health', tags: [] },
    { name: 'Canal View Homes', address: 'Welland', city: 'Welland', accountType: 'Group Home', bedCount: 15, ownership: 'Not-for-profit', organization: 'Gateway', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Cluster homes', tags: [] },
    { name: 'ARID Recovery Homes Niagara', address: 'Multiple sites', city: 'Welland', accountType: 'Group Home', bedCount: 40, ownership: 'Not-for-profit', organization: 'ARID', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Short-term recovery', tags: [] },
    { name: 'Bethlehem Housing and Support Services', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Group Home', bedCount: 100, ownership: 'Not-for-profit', organization: 'Bethlehem', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Transitional housing', tags: [] },
    { name: 'Nest Niagara', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Group Home', bedCount: 50, ownership: 'Not-for-profit', organization: 'Nest', priorityTier: 'Low', adpVolume: 30, relationshipStrength: 'New', notes: 'Aging-in-place', tags: [] },
    { name: 'Niagara Peninsula Homes', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Group Home', bedCount: 1800, ownership: 'Municipal/Non-profit', organization: 'NPH', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Indirect influence', tags: [] },

    // ===== PAGE 4: HOSPITALS =====
    { name: 'Niagara Falls Hospital', address: '5546 Portage Rd', city: 'Niagara Falls', accountType: 'Hospital', bedCount: 225, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Stroke, rehab, discharge pipeline', tags: [] },
    { name: 'Marotta Family Hospital', address: '1200 Fourth Ave', city: 'St. Catharines', accountType: 'Hospital', bedCount: 475, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Largest acute site, high OT volume', tags: [] },
    { name: 'Welland Hospital', address: '65 Third St', city: 'Welland', accountType: 'Hospital', bedCount: 88, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Transitional + redevelopment', tags: [] },
    { name: 'Port Colborne Urgent Care Centre', address: '260 Sugarloaf St', city: 'Port Colborne', accountType: 'Hospital', bedCount: 25, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Limited inpatient', tags: [] },
    { name: 'Fort Erie Urgent Care Centre', address: '1485 Garrison Rd', city: 'Fort Erie', accountType: 'Hospital', bedCount: 25, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'Low', adpVolume: 10, relationshipStrength: 'New', notes: 'Community access point', tags: [] },
    { name: 'West Lincoln Memorial Hospital', address: '169 Main St E', city: 'Grimsby', accountType: 'Hospital', bedCount: 70, ownership: 'Public', organization: 'Hamilton Health Sciences', priorityTier: 'High', adpVolume: 30, relationshipStrength: 'New', notes: 'Key Grimsby site', tags: [] },

    // ===== PAGE 5: CLINICS =====
    { name: 'Niagara Health – Outpatient Rehab', address: '1200 Fourth Ave', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Direct OT/PT referral pipeline', tags: [] },
    { name: 'Niagara Falls Hospital Rehab Services', address: '5546 Portage Rd', city: 'Niagara Falls', accountType: 'Clinic', bedCount: 0, ownership: 'Public', organization: 'Niagara Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Stroke + mobility cases', tags: [] },
    { name: 'Hotel Dieu Shaver Health and Rehabilitation Centre', address: '541 Glenridge Ave', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Not-for-profit', organization: 'Hotel Dieu Shaver', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'HUGE rehab + wheelchair referrals', tags: [] },
    { name: 'CBI Health St. Catharines', address: 'Multiple sites', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'CBI Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'OT + PT + ADP', tags: [] },
    { name: 'CBI Health Niagara Falls', address: 'Multiple sites', city: 'Niagara Falls', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'CBI Health', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Strong referral source', tags: [] },
    { name: 'Lifemark Physiotherapy St. Catharines', address: 'Multiple sites', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Lifemark', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Large national chain', tags: [] },
    { name: 'Lifemark Physiotherapy Welland', address: 'Multiple sites', city: 'Welland', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Lifemark', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Rehab focus', tags: [] },
    { name: 'Lifemark Physiotherapy Grimsby', address: 'Multiple sites', city: 'Grimsby', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Lifemark', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'West Niagara coverage', tags: [] },
    { name: 'Niagara Orthopaedic Institute', address: '34 Scott St', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Post-surgical mobility', tags: [] },
    { name: 'Niagara Physiotherapy & Sports Clinic', address: 'Niagara Falls', city: 'Niagara Falls', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Local clinic', tags: [] },
    { name: 'Falls Physiotherapy', address: 'Niagara Falls', city: 'Niagara Falls', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Falls area', tags: [] },
    { name: 'Pelham Physiotherapy', address: 'Fonthill', city: 'Pelham', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Private', priorityTier: 'Medium', adpVolume: 30, relationshipStrength: 'New', notes: 'Fonthill coverage', tags: [] },
    { name: "Niagara Children's Centre", address: '567 Glenridge Ave', city: 'St. Catharines', accountType: 'Clinic', bedCount: 0, ownership: 'Not-for-profit', organization: "Niagara Children's Centre", priorityTier: 'High', adpVolume: 30, relationshipStrength: 'New', notes: 'Pediatric mobility equipment', tags: [] },
    { name: 'March of Dimes Canada – Niagara', address: 'Multiple sites', city: 'Niagara Region', accountType: 'Clinic', bedCount: 0, ownership: 'Not-for-profit', organization: 'March of Dimes', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Strong ADP involvement', tags: [] },
    { name: 'Closing the Gap Healthcare', address: 'Mobile', city: 'Niagara Region', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Closing the Gap', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'In-home OT = huge referrals', tags: [] },
    { name: 'CarePartners Rehabilitation', address: 'Mobile', city: 'Niagara Region', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'CarePartners', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'New', notes: 'Home-based ADP pipeline', tags: [] },
  ];

  accounts.forEach(a => saveAccount(a));
}
