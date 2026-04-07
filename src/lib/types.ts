export type AccountType = 'LTC' | 'Retirement' | 'Hospital' | 'Clinic' | 'Group Home';
export type PriorityTier = 'High' | 'Medium' | 'Low';
export type RelationshipStrength = 'Strong' | 'Moderate' | 'Weak' | 'New';
export type InteractionType = 'Visit' | 'Call' | 'Email' | 'Demo' | 'Service Follow-up';
export type FollowUpStatus = 'Pending' | 'Completed';
export type StoreRole = 'Rep' | 'Admin' | 'Service' | 'Manager';

export interface Account {
  id: string;
  name: string;
  address: string;
  city: string;
  accountType: AccountType;
  bedCount: number;
  ownership: string;
  organization: string;
  priorityTier: PriorityTier;
  adpVolume: number;
  relationshipStrength: RelationshipStrength;
  notes: string;
  tags: string[];
  createdAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Interaction {
  id: string;
  date: string;
  accountId: string;
  contactId: string;
  type: InteractionType;
  notes: string;
  outcome: string;
}

export interface FollowUp {
  id: string;
  accountId: string;
  contactId: string;
  dueDate: string;
  type: string;
  status: FollowUpStatus;
  notes: string;
}

export interface StoreMember {
  id: string;
  userId: string;
  storeId: string;
  role: StoreRole;
}
