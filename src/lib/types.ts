export type AccountType = 'LTC' | 'Retirement' | 'Hospital' | 'Clinic' | 'Group Home';
export type PriorityTier = 'High' | 'Medium' | 'Low';
export type RelationshipStrength = 'Strong' | 'Moderate' | 'Weak' | 'New';
export type PipelineStage = 'Prospect' | 'Contacted' | 'Engaged' | 'Demo' | 'Active' | 'Lost';
export type InteractionType = 'Visit' | 'Call' | 'Email' | 'Demo' | 'Service Follow-up';
export type FollowUpStatus = 'Pending' | 'Completed';

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
  adpVolume?: string;
  relationshipStrength: RelationshipStrength;
  notes: string;
  tags: string[];
  accountValue?: number;
  createdAt: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  pipelineStage?: PipelineStage;
  accountManager?: string;
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
  addedByName?: string;
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

export type UserRole = 'Sales' | 'Manager' | 'Service' | 'Retail' | 'Technician';
export const USER_ROLES: UserRole[] = ['Sales', 'Manager', 'Service', 'Retail', 'Technician'];

export interface StoreProfile {
  id: string;
  fullName: string;
  role: string;
  email: string;
}
