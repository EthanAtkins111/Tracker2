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

// Seed data
export function seedData() {
  if (getAccounts().length > 0) return;

  const accounts: Omit<Account, 'id' | 'createdAt'>[] = [
    { name: 'Sunrise Senior Living', address: '145 Maple Ave', city: 'Hamilton', accountType: 'LTC', bedCount: 180, ownership: 'Corporate', organization: 'Sunrise Health Group', priorityTier: 'High', adpVolume: 45, relationshipStrength: 'Strong', notes: 'Key account, good rapport with DOC', tags: ['Wheelchair Program'] },
    { name: 'Lakeview Retirement Residence', address: '300 Lakeshore Rd', city: 'Burlington', accountType: 'Retirement', bedCount: 120, ownership: 'Private', organization: 'Lakeview Corp', priorityTier: 'High', adpVolume: 30, relationshipStrength: 'Moderate', notes: 'Expanding to new wing Q3', tags: ['New Build'] },
    { name: 'St. Joseph Healthcare', address: '50 Charlton Ave E', city: 'Hamilton', accountType: 'Hospital', bedCount: 560, ownership: 'Municipal', organization: 'St. Joseph Health System', priorityTier: 'High', adpVolume: 80, relationshipStrength: 'Weak', notes: 'Need to establish OT contact', tags: [] },
    { name: 'Dundas Medical Clinic', address: '22 King St W', city: 'Dundas', accountType: 'Clinic', bedCount: 0, ownership: 'Private', organization: 'Independent', priorityTier: 'Medium', adpVolume: 10, relationshipStrength: 'New', notes: 'Referred by Dr. Patel', tags: [] },
    { name: 'Harmony House Group Home', address: '88 Concession St', city: 'Hamilton', accountType: 'Group Home', bedCount: 12, ownership: 'Non-Profit', organization: 'Harmony Living Services', priorityTier: 'Low', adpVolume: 5, relationshipStrength: 'Moderate', notes: '', tags: [] },
    { name: 'Oakville Trafalgar Hospital', address: '3001 Hospital Gate', city: 'Oakville', accountType: 'Hospital', bedCount: 457, ownership: 'Municipal', organization: 'Halton Healthcare', priorityTier: 'High', adpVolume: 65, relationshipStrength: 'Moderate', notes: 'Strong rehab department', tags: [] },
    { name: 'Willowgrove LTC', address: '190 Erie Ave', city: 'Brantford', accountType: 'LTC', bedCount: 96, ownership: 'Corporate', organization: 'Extendicare', priorityTier: 'Medium', adpVolume: 20, relationshipStrength: 'Weak', notes: 'New administrator started', tags: [] },
    { name: 'Chartwell Waterford', address: '55 Leland St', city: 'Hamilton', accountType: 'Retirement', bedCount: 200, ownership: 'Corporate', organization: 'Chartwell', priorityTier: 'High', adpVolume: 35, relationshipStrength: 'Strong', notes: 'Flagship location', tags: ['Wheelchair Program'] },
  ];

  const savedAccounts = accounts.map(a => saveAccount(a));

  const contacts: Omit<Contact, 'id'>[] = [
    { accountId: savedAccounts[0].id, name: 'Sarah Chen', role: 'Director of Care', phone: '905-555-0101', email: 'schen@sunrise.ca', notes: 'Primary decision maker' },
    { accountId: savedAccounts[0].id, name: 'Mike Torres', role: 'OT', phone: '905-555-0102', email: 'mtorres@sunrise.ca', notes: 'Handles ADP assessments' },
    { accountId: savedAccounts[1].id, name: 'Janet Williams', role: 'Nurse Manager', phone: '905-555-0201', email: 'jwilliams@lakeview.ca', notes: '' },
    { accountId: savedAccounts[2].id, name: 'Dr. Amir Hassan', role: 'Physiatrist', phone: '905-555-0301', email: 'ahassan@stjoseph.ca', notes: 'Specializes in seating' },
    { accountId: savedAccounts[3].id, name: 'Dr. Priya Patel', role: 'Physician', phone: '905-555-0401', email: 'ppatel@dundasmed.ca', notes: '' },
    { accountId: savedAccounts[5].id, name: 'Lisa Park', role: 'PT', phone: '905-555-0601', email: 'lpark@haltonhc.ca', notes: 'Key referral source' },
    { accountId: savedAccounts[7].id, name: 'Tom Bradley', role: 'General Manager', phone: '905-555-0801', email: 'tbradley@chartwell.com', notes: 'Very responsive' },
  ];

  const savedContacts = contacts.map(c => saveContact(c));

  const today = new Date();
  const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000).toISOString().split('T')[0];

  const interactions: Omit<Interaction, 'id'>[] = [
    { date: daysAgo(2), accountId: savedAccounts[0].id, contactId: savedContacts[0].id, type: 'Visit', notes: 'Discussed new wheelchair models', outcome: 'Interested in demo' },
    { date: daysAgo(15), accountId: savedAccounts[1].id, contactId: savedContacts[2].id, type: 'Call', notes: 'Follow up on expansion plans', outcome: 'Meeting scheduled for next month' },
    { date: daysAgo(35), accountId: savedAccounts[2].id, contactId: savedContacts[3].id, type: 'Email', notes: 'Sent product catalog', outcome: 'No response yet' },
    { date: daysAgo(5), accountId: savedAccounts[7].id, contactId: savedContacts[6].id, type: 'Visit', notes: 'Quarterly review', outcome: 'Placed order for 5 units' },
    { date: daysAgo(60), accountId: savedAccounts[5].id, contactId: savedContacts[5].id, type: 'Demo', notes: 'Power chair demo', outcome: 'Very positive feedback' },
    { date: daysAgo(45), accountId: savedAccounts[6].id, contactId: '', type: 'Call', notes: 'Introduction call to new admin', outcome: 'Agreed to in-person meeting' },
  ];

  interactions.forEach(i => saveInteraction(i));

  const daysFromNow = (d: number) => new Date(today.getTime() + d * 86400000).toISOString().split('T')[0];

  const followUps: Omit<FollowUp, 'id'>[] = [
    { accountId: savedAccounts[0].id, contactId: savedContacts[0].id, dueDate: daysFromNow(0), type: '1 week', status: 'Pending', notes: 'Schedule demo' },
    { accountId: savedAccounts[1].id, contactId: savedContacts[2].id, dueDate: daysFromNow(5), type: '1 month', status: 'Pending', notes: 'Check on expansion timeline' },
    { accountId: savedAccounts[2].id, contactId: savedContacts[3].id, dueDate: daysFromNow(-3), type: '1 week', status: 'Pending', notes: 'Follow up on catalog' },
    { accountId: savedAccounts[5].id, contactId: savedContacts[5].id, dueDate: daysFromNow(2), type: '3 months', status: 'Pending', notes: 'Check on power chair decision' },
    { accountId: savedAccounts[6].id, contactId: '', dueDate: daysFromNow(-1), type: '1 month', status: 'Pending', notes: 'Schedule in-person visit' },
  ];

  followUps.forEach(f => saveFollowUp(f));
}
